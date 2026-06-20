// Create a webpack context for all .md files in the target folder
const context = import.meta.webpackContext("./public", {
  recursive: false,
  regExp: /\.md$/,
});

function extractDescription(content) {
  if (content.startsWith("---")) {
    const end = content.indexOf("---", 3);
    if (end !== -1) {
      const yaml = content.slice(3, end).trim();
      const lines = yaml.split("\n");
      const descLine = lines.find((l) =>
        l.toLowerCase().startsWith("description:")
      );
      if (descLine) {
        return descLine.split(":").slice(1).join(":").trim();
      }
    }
  }

  const firstLine = content
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);

  return firstLine ? firstLine.slice(0, 120) : "(no description)";
}

function extractNameFromPath(path) {
  const parts = path.split("/");
  const file = parts[parts.length - 1];
  return file.replace(/\.md$/, "");
}

export async function loadAllSkills() {
  const keys = context.keys();

  const promises = keys.map(async (key) => {
    const name = extractNameFromPath(key);

    // This is likely a URL or asset path, not the actual file text
    const module = context(key);
    const assetUrl =
      typeof module === "string"
        ? module
        : typeof module?.default === "string"
        ? module.default
        : null;

    if (!assetUrl) {
      throw new Error(`Could not resolve markdown asset URL for skill: ${key}`);
    }

    // Fetch the actual markdown file content
    const response = await fetch(assetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch skill content from ${assetUrl}`);
    }

    const content = await response.text();
    const summary = extractDescription(content);

    return {
      id: key,
      name,

      // Use this in popup UI
      summary,

      // Use this when sending to backend
      description: content,

      // Optional helper if you still want lazy access
      loadContent: async () => content,
    };
  });

  const skills = await Promise.all(promises);
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}
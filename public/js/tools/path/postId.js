export function parsePostIdFromPath(path) {
    // Match /post/:id pattern
    const match = path.match(/^\/post\/(\d+)$/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
}

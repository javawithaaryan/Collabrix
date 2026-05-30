export const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export function isObjectId(value) {
  return OBJECT_ID_PATTERN.test(String(value || ""));
}

export function workspacePath(workspaceId, section = "dashboard") {
  if (!isObjectId(workspaceId)) {
    console.error("[workspace-route] Blocked navigation with invalid workspace id:", workspaceId);
    return null;
  }

  const normalizedSection = String(section || "dashboard").replace(/^\/+/, "");
  return `/workspace/${workspaceId}/${normalizedSection}`;
}

export function navigateToWorkspace(navigate, workspaceId, section = "dashboard") {
  const path = workspacePath(workspaceId, section);
  if (!path) return false;

  localStorage.setItem("activeWorkspaceId", workspaceId);
  navigate(path);
  return true;
}

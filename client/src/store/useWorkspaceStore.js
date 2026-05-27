import { useState } from "react";

export default function useWorkspaceStore() {
  const [workspace, setWorkspace] = useState(null);
  return { workspace, setWorkspace };
}

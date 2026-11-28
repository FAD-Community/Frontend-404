import { api } from "./http";

export function getParentAccounts({
  search = "",
  role = "Parent",
  status = "",
  page = 1,
  pageSize = 100,
  signal,
} = {}) {
  return api.get("/accounts", {
    params: { search, role, status, page, pageSize },
    signal,
  });
}

export function getParentChildren(parentId, { signal } = {}) {
  return api.get(`/parents/${parentId}/children`, { signal });
}

export function getParentLinkCandidates(
  parentId,
  { search = "", page = 1, pageSize = 8, signal } = {}
) {
  return api.get(`/parents/${parentId}/link-candidates`, {
    params: { search, page, pageSize },
    signal,
  });
}

export function createParentLink({ parentId, studentId, relationship }) {
  return api.post("/parent-links", { parentId, studentId, relationship });
}

export function removeParentLink(linkId) {
  return api.delete(`/parent-links/${linkId}`);
}

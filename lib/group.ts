export function getGroupId() {
  let groupId = localStorage.getItem("groupId");

  if (!groupId) {
    groupId = crypto.randomUUID();
    localStorage.setItem("groupId", groupId);
  }

  return groupId;
}
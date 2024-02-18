// Line Pay (financial verification) - FIDO assertion 的 { account: currentChallenge }
async function setUserCurrentChallenge(client, account, currentChallenge) {
  // 選擇 db3
  await client.select(3);
  await client.set(account, currentChallenge);
}

async function getUserCurrentChallenge(client, account) {
  // 選擇 db3
  await client.select(3);
  return await client.get(account);
}

module.exports = {
  setUserCurrentChallenge,
  getUserCurrentChallenge,
};

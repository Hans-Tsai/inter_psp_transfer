// Line Pay (financial verification) - FIDO attestation 的 { account: currentChallenge }
async function setUserCurrentChallenge(client, account, currentChallenge) {
  // 選擇 db2
  await client.select(2);
  await client.set(account, currentChallenge);
}

async function getUserCurrentChallenge(client, account) {
  // 選擇 db2
  await client.select(2);
  return await client.get(account);
}

module.exports = {
  setUserCurrentChallenge,
  getUserCurrentChallenge,
};

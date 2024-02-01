// Line Pay - FIDO assertion 的 { account: currentChallenge }
async function setUserCurrentChallenge(client, account, currentChallenge) {
    // 選擇 db1
    await client.select(1);
    await client.set(account, currentChallenge);
}

async function getUserCurrentChallenge(client, account) {
    // 選擇 db1
    await client.select(1);
    return await client.get(account);
}

module.exports = {
    setUserCurrentChallenge,
    getUserCurrentChallenge,
};

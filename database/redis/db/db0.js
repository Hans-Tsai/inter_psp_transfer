// Line Pay - FIDO attestation 的 { account: currentChallenge }
async function setUserCurrentChallenge(client, account, currentChallenge) {
    // 選擇 db0
    await client.select(0);
    await client.set(account, currentChallenge);
}

async function getUserCurrentChallenge(client, account) {
    // 選擇 db0
    await client.select(0);
    return await client.get(account);
}

module.exports = {
    setUserCurrentChallenge,
    getUserCurrentChallenge,
};

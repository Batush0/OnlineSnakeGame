const argon2 = require('argon2');
const crypto = require('crypto');

const hashingConfig = { // based on OWASP cheat sheet recommendations (as of March, 2022)
    parallelism: 1,
    memoryCost: 64000, // 64 mb
    timeCost: 3 // number of itetations
}

async function generateToken(password) {
    let salt = crypto.randomBytes(16);
    return await argon2.hash(password, {...hashingConfig,salt})
}


async function verifyPasswordWithHash(password, hash) {
    return await argon2.verify(hash, password, hashingConfig);
}

module.exports = {
    generateToken,
    verifyPasswordWithHash,
};
const TopupRepository = require("../repository/TopupRepository");
const Crypto = require("../utils/Crypto");
const { HttpBadRequest } = require("../utils/HttpError");

module.exports = class TopupService {
	#repository;

	constructor() {
		this.#repository = new TopupRepository();
	}

	async VerifyTopupByIdentifier(identifier) {
		const result = await this.#repository.VerifyTopupByIdentifier(identifier);

		if (!result[0]) throw new HttpBadRequest("ACCOUNT_NOT_FOUND", []);

		const user = Object.entries(result[0]);

		let decryptedUser = {};

		for (const [key, value] of user) {
			if (!["id", "username", "rfid"].includes(key))
				decryptedUser[key] = Crypto.Decrypt(value);
			else decryptedUser[key] = value;
		}
		return decryptedUser;
	}

	async Topup(identifier, amount) {
		const result = await this.#repository.Topup(identifier, amount);

		if (result.affectedRows > 0) return "SUCCESS";
	}
};

/**
 * @CreatedBy Adrian Nads L. Marcelo
 * @CreatedAt 2024-03-20
 * @LastModified 2024-03-21
 */
const TopupRepository = require("../repository/TopupRepository");
const Crypto = require("../utils/Crypto");
const { HttpBadRequest } = require("../utils/HttpError");

const logger = require("../config/winston");

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

	async Topup(identifier, amount, paymentType) {
		const result = await this.#repository.Topup(
			identifier,
			amount,
			paymentType
		);

		const STATUS = result[0][0].STATUS;
		const new_balance = result[0][0].new_balance;

		logger.info(STATUS);

		if (STATUS !== "SUCCESS") return STATUS;

		return { STATUS, new_balance };
	}

	async GetTopupsByUserID(userID, currentDateTime) {
		const result = await this.#repository.GetTopupsByUserID(
			userID,
			currentDateTime
		);

		return result;
	}

	async VoidTopupByReferenceNumber(referenceNumber) {
		const result = await this.#repository.VoidTopupByReferenceNumber(
			referenceNumber
		);

		const STATUS = result[0][0].STATUS;
		const reference_number = result[0][0].reference_number;
		const current_balance = result[0][0].current_balance;

		if (STATUS !== "SUCCESS") return STATUS;

		return { STATUS, current_balance, reference_number };
	}
};

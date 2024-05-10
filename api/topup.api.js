/**
 * @CreatedBy Adrian Nads L. Marcelo
 * @CreatedAt 2024-03-20
 * @LastModified 2024-03-21
 */
const { validationResult, param, body } = require("express-validator");

const TopupService = require("../services/TopupService");
const TokenMiddleware = require("../middlewares/TokenMiddleware");
const {
	ROLES,
	RoleManagementMiddleware,
} = require("../middlewares/RoleManagementMiddleware");

// Utilities
const logger = require("../config/winston");
const { HttpUnprocessableEntity } = require("../utils/HttpError");

/**
 * @param {import('express').Express} app
 */
module.exports = (app) => {
	const service = new TopupService();
	const tokenMiddleware = new TokenMiddleware();
	const roleMiddleware = new RoleManagementMiddleware();

	/**
	 * This function will be used by the express-validator for input validation,
	 * and to be attached to APIs middleware.
	 * @param {*} req
	 * @param {*} res
	 */
	function validate(req, res) {
		const ERRORS = validationResult(req);

		if (!ERRORS.isEmpty()) {
			throw new HttpUnprocessableEntity(
				"Unprocessable Entity",
				ERRORS.mapped()
			);
		}
	}

	app.get(
		"/merchant_topup/api/v1/topup/verify/:identifier",
		[
			tokenMiddleware.AccessTokenVerifier(),
			roleMiddleware.CheckRole(ROLES.CPO_OWNER),
			param("identifier")
				.notEmpty()
				.withMessage("Missing required parameter: identifier"),
		],
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
			logger.info({
				TOPUP_VERIFY_RFID_REQUEST: { identifier: req.params.identifier },
			});

			try {
				if (req.role !== "CPO_OWNER") throw new HttpForbidden("Forbidden", []);

				const { identifier } = req.params;

				logger.info({
					TOPUP_VERIFY_RFID_REQUEST: {
						data: { identifier },
						message: "SUCCESS",
					},
				});

				const result = await service.VerifyTopupByIdentifier(identifier);

				logger.info({ TOPUP_VERIFY_RFID_RESPONSE: { message: "SUCCESS" } });

				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				req.error_name = "TOPUP_VERIFY_RFID_ERROR";
				next(err);
			}
		}
	);

	app.post(
		"/merchant_topup/api/v1/topup/:identifier",
		[
			tokenMiddleware.AccessTokenVerifier(),
			roleMiddleware.CheckRole(ROLES.CPO_OWNER),
			body("amount")
				.notEmpty()
				.withMessage("Missing required property: amount")
				.isInt({ min: 27 })
				.withMessage(
					"Amount must be a whole number, and the minimum amount for topup is twenty-seven (27) pesos"
				)
				.escape()
				.trim(),
			body("payment_type")
				.notEmpty()
				.withMessage("Missing required property: payment_type")
				.custom((value) => ["CARD", "MAYA", "GCASH"].includes(value))
				.withMessage("Valid payment types are: CARD, MAYA, GCASH")
				.escape()
				.trim(),
		],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
			logger.info({
				TOPUP_REQUEST: {
					identifier: req.params.identifier,
					body: req.body.amount,
				},
			});

			try {
				validate(req, res);

				if (req.role !== "CPO_OWNER") throw new HttpForbidden("Forbidden", []);

				const { identifier } = req.params;
				const { amount, payment_type } = req.body;

				logger.info({ TOPUP_REQUEST: { identifier, amount, payment_type } });

				const result = await service.Topup(identifier, amount, payment_type);

				logger.info({ TOPUP_RESPONSE: { message: "SUCCESS" } });

				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				req.error_name = "TOPUP_ERROR";
				next(err);
			}
		}
	);

	app.get(
		"/merchant_topup/api/v1/topup/:user_id",
		[
			tokenMiddleware.AccessTokenVerifier(),
			roleMiddleware.CheckRole(ROLES.CPO_OWNER),
			body("current_datetime")
				.notEmpty()
				.withMessage("Missing required property: current_datetime")
				.custom((value) =>
					String(value).match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
				)
				.withMessage("Datetime must be in format of: YYYY-MM-DD HH:MM:SS")
				.escape()
				.trim(),
		],
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
			try {
				const { user_id } = req.params;
				const { current_datetime } = req.body;

				logger.info({
					USER_TOPUPS_REQUEST: {
						data: {
							user_id,
							current_datetime,
						},
						message: "SUCCESS",
					},
				});

				const result = await service.GetTopupsByUserID(
					user_id,
					current_datetime
				);

				logger.info({
					USER_TOPUPS_RESPONSE: {
						message: "SUCCESS",
					},
				});

				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				req.error_name = "USER_TOPUPS_ERROR";
				next(err);
			}
		}
	);

	app.post(
		"/merchant_topup/api/v1/topup/void/:reference_number",
		[
			tokenMiddleware.AccessTokenVerifier(),
			roleMiddleware.CheckRole(ROLES.CPO_OWNER),
			param("reference_number")
				.notEmpty()
				.withMessage("Missing required parameter: reference_number"),
		],
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res, next) => {
			logger.info({
				VOID_TOPUP_REQUEST: { user_id: req.params.reference_number },
			});

			try {
				const { reference_number } = req.params;

				logger.info({
					VOID_TOPUP_REQUEST: {
						data: { reference_number },
						message: "SUCCESS",
					},
				});

				const result = await service.VoidTopupByReferenceNumber(
					reference_number
				);

				logger.info({
					VOID_TOPUP_RESPONSE: {
						message: "SUCCESS",
					},
				});

				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				req.error_name = "VOID_TOPUP_ERROR";
				next(err);
			}
		}
	);

	app.use((err, req, res, next) => {
		logger.error({
			API_REQUEST_ERROR: {
				error_name: req.error_name || "UNKNOWN_ERROR",
				message: err.message,
				stack: err.stack.replace(/\\/g, "/"), // Include stack trace for debugging
				request: {
					method: req.method,
					url: req.url,
					code: err.status || 500,
				},
				data: err.data || [],
			},
		});

		const status = err.status || 500;
		const message = err.message || "Internal Server Error";

		res.status(status).json({
			status,
			data: err.data || [],
			message,
		});
	});
};

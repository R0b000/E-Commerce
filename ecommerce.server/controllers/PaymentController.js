const { Router } = require('express');
const { PaymentService } = require('../services/PaymentService');
const { optionalAuth } = require('../middleware/rbacMiddleware');

const paymentRouter = Router();
const paymentService = new PaymentService();

/**
 * Initiate Khalti payment
 * POST /ecommerce/payment/khalti/initiate
 */
paymentRouter.post('/khalti/initiate', optionalAuth, async (req, res) => {
  const result = await paymentService.initiateKhaltiPayment(req.body);
  res.status(result.statusCode || 200).json(result);
});

/**
 * Verify Khalti payment
 * POST /ecommerce/payment/khalti/verify
 */
paymentRouter.post('/khalti/verify', optionalAuth, async (req, res) => {
  const result = await paymentService.verifyKhaltiPayment(req.body);
  res.status(result.statusCode || 200).json(result);
});

/**
 * Initiate eSewa payment
 * POST /ecommerce/payment/esewa/initiate
 */
paymentRouter.post('/esewa/initiate', optionalAuth, async (req, res) => {
  const result = await paymentService.initiateEsewaPayment(req.body);
  res.status(result.statusCode || 200).json(result);
});

/**
 * Verify eSewa payment
 * POST /ecommerce/payment/esewa/verify
 */
paymentRouter.post('/esewa/verify', optionalAuth, async (req, res) => {
  const result = await paymentService.verifyEsewaPayment(req.body);
  res.status(result.statusCode || 200).json(result);
});

module.exports = { paymentRouter };

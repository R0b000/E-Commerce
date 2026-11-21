const { Router } = require('express');
const { categoryRouter } = require('./CategoryController');
const { productRouter } = require('./ProductController');
const { orderRouter } = require('./OrderController');
const { dashboardRouter } = require('./DashboardController');
const { customerRouter } = require('./CustomerController');
const { rbacRouter } = require('./RbacController');
const { reviewRouter } = require('./ReviewController');
const { auditRouter } = require('./AuditController');
const { billingRouter } = require('./BillingController');
const { uploadRouter } = require('./UploadController');
const { paymentRouter } = require('./PaymentController');
const { discountRouter } = require('./DiscountController');
const { bannerRouter } = require('./BannerController');

const ecommerceRouter = Router();

ecommerceRouter.use('/categories', categoryRouter);
ecommerceRouter.use('/products', productRouter);
ecommerceRouter.use('/orders', orderRouter);
ecommerceRouter.use('/dashboard', dashboardRouter);
ecommerceRouter.use('/customers', customerRouter);
ecommerceRouter.use('/rbac', rbacRouter);
ecommerceRouter.use('/reviews', reviewRouter);
ecommerceRouter.use('/audit-logs', auditRouter);
ecommerceRouter.use('/billing', billingRouter);
ecommerceRouter.use('/upload', uploadRouter);
ecommerceRouter.use('/payment', paymentRouter);
ecommerceRouter.use('/discounts', discountRouter);
ecommerceRouter.use('/banners', bannerRouter);
ecommerceRouter.use('/menus', (req, res, next) => {
  req.url = '/user-menus';
  rbacRouter(req, res, next);
});

module.exports = { ecommerceRouter };

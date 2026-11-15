const { Router } = require('express');
const { categoryRouter } = require('./CategoryController');
const { productRouter } = require('./ProductController');
const { orderRouter } = require('./OrderController');
const { dashboardRouter } = require('./DashboardController');
const { customerRouter } = require('./CustomerController');
const { rbacRouter } = require('./RbacController');
const { reviewRouter } = require('./ReviewController');
const { auditRouter } = require('./AuditController');

const ecommerceRouter = Router();

ecommerceRouter.use('/categories', categoryRouter);
ecommerceRouter.use('/products', productRouter);
ecommerceRouter.use('/orders', orderRouter);
ecommerceRouter.use('/dashboard', dashboardRouter);
ecommerceRouter.use('/customers', customerRouter);
ecommerceRouter.use('/rbac', rbacRouter);
ecommerceRouter.use('/reviews', reviewRouter);
ecommerceRouter.use('/audit-logs', auditRouter);
ecommerceRouter.use('/menus', (req, res, next) => {
  req.url = '/user-menus';
  rbacRouter(req, res, next);
});

module.exports = { ecommerceRouter };

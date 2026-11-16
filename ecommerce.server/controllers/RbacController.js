const { Router } = require('express');
const { RbacService } = require('../services/RbacService');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/rbacMiddleware');

const rbacRouter = Router();
const rbacService = new RbacService();

// User Dynamic Menus (Filtered by role and effective permissions)
rbacRouter.get('/user-menus', optionalAuth, async (req, res) => {
  const simulatedRole = req.query.role || req.headers['x-active-role'] || null;
  const result = await rbacService.getUserMenus(req.user, simulatedRole);
  res.status(result.statusCode || 200).json(result);
});

// Admin: Get all menus
rbacRouter.get('/menus', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await rbacService.getAllMenus();
  res.status(result.statusCode || 200).json(result);
});

// Admin: Create new dynamic menu / page
rbacRouter.post('/menus', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await rbacService.createMenu(req.body);
  res.status(result.statusCode || 201).json(result);
});

// Admin: Update dynamic menu
rbacRouter.put('/menus/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await rbacService.updateMenu(req.params.id, req.body);
  res.status(result.statusCode || 200).json(result);
});

// Admin: Delete dynamic menu
rbacRouter.delete('/menus/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await rbacService.deleteMenu(req.params.id);
  res.status(result.statusCode || 200).json(result);
});

// Admin: Get roles and their permissions
rbacRouter.get('/roles', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await rbacService.getRoles();
  res.status(result.statusCode || 200).json(result);
});

// Admin: Create new role
rbacRouter.post('/roles', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await rbacService.createRole(req.body);
  res.status(result.statusCode || 201).json(result);
});

// Admin: Update role permissions
rbacRouter.put('/roles/:roleName', authenticateToken, requireRole('admin'), async (req, res) => {
  const { permissions } = req.body;
  const result = await rbacService.updateRolePermissions(req.params.roleName, permissions);
  res.status(result.statusCode || 200).json(result);
});

// Admin: Get all available permissions
rbacRouter.get('/permissions', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await rbacService.getPermissions();
  res.status(result.statusCode || 200).json(result);
});

// Admin: Create custom permission
rbacRouter.post('/permissions', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await rbacService.createPermission(req.body);
  res.status(result.statusCode || 201).json(result);
});

// Admin: List all users with custom permissions
rbacRouter.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  const result = await rbacService.getUsersWithPermissions();
  res.status(result.statusCode || 200).json(result);
});

// Admin: Assign special custom permissions to a user
rbacRouter.post('/users/:userId/permissions', authenticateToken, requireRole('admin'), async (req, res) => {
  const { customPermissions } = req.body;
  const result = await rbacService.assignUserPermissions(req.params.userId, customPermissions);
  res.status(result.statusCode || 200).json(result);
});

module.exports = { rbacRouter };

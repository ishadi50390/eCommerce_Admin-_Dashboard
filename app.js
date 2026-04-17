import express from 'express';
import bcrypt from 'bcrypt';
import 'dotenv/config';

import sequelize from './config/db.js';

import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import OrderItem from './models/OrderItem.js';
import Setting from './models/Setting.js';

import authRoutes from './routes/authRoutes.js';

import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import AdminJSSequelize from '@adminjs/sequelize';
import { ComponentLoader } from 'adminjs';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

AdminJS.registerAdapter(AdminJSSequelize);

const componentLoader = new ComponentLoader();

const Components = {
  Dashboard: componentLoader.add(
    "Dashboard",
    path.join(__dirname, "components", "AdminDashboard.jsx")
  ),
};

Product.belongsTo(Category);
Category.hasMany(Product);

Order.belongsTo(User);
User.hasMany(Order);

OrderItem.belongsTo(Order);
Order.hasMany(OrderItem);

OrderItem.belongsTo(Product);
Product.hasMany(OrderItem);

const getDashboardData = async (request, response, context) => {
  const currentAdmin =
    context?.currentAdmin ||
    request?.session?.adminUser ||
    request?.session?.admin ||
    null;

  const currentEmail = currentAdmin?.email || null;
  const currentAdminId = currentAdmin?.id || null;

  const currentUser = currentEmail || currentAdminId
    ? await User.findOne({
        where: currentEmail
          ? { email: currentEmail }
          : { id: currentAdminId },
      })
    : null;

  const normalizedRole =
    currentUser?.role ||
    currentAdmin?.role ||
    "user";

  const personalInfo = {
    name: currentUser?.name || currentAdmin?.name || "-",
    email: currentEmail || currentUser?.email || "-",
    role: normalizedRole,
    joinedAt: currentUser?.createdAt || null,
  };

  const totalUsers = await User.count();
  const adminTotalOrders = await Order.count();
  const totalRevenue = (await Order.sum("total")) || 0;

  const adminRecentOrders = await Order.findAll({
    include: [
      {
        model: User,
        attributes: ["name", "email"],
      },
    ],
    limit: 6,
    order: [["createdAt", "DESC"]],
  });

  const userOrdersFilter = currentUser
    ? { where: { UserId: currentUser.id } }
    : { where: { id: null } };

  const userRecentOrders = await Order.findAll({
    ...userOrdersFilter,
    limit: 6,
    order: [["createdAt", "DESC"]],
  });

  const userTotalOrders = await Order.count(userOrdersFilter);

  if (normalizedRole === "admin") {
    return {
      role: "admin",
      personalInfo,
      totalUsers,
      totalOrders: adminTotalOrders,
      totalRevenue,
      adminTotalOrders,
      userTotalOrders,
      recentOrders: adminRecentOrders.map((order) => ({
        id: order.id,
        total: order.total || 0,
        createdAt: order.createdAt,
        customerName: order.User?.name || "Unknown",
        customerEmail: order.User?.email || "-",
      })),
      adminRecentOrders: adminRecentOrders.map((order) => ({
        id: order.id,
        total: order.total || 0,
        createdAt: order.createdAt,
        customerName: order.User?.name || "Unknown",
        customerEmail: order.User?.email || "-",
      })),
      userRecentOrders: userRecentOrders.map((order) => ({
        id: order.id,
        total: order.total || 0,
        createdAt: order.createdAt,
      })),
    };
  }

  return {
    role: "user",
    personalInfo,
    totalUsers,
    totalRevenue,
    totalOrders: userTotalOrders,
    adminTotalOrders,
    userTotalOrders,
    recentOrders: userRecentOrders.map((order) => ({
      id: order.id,
      total: order.total || 0,
      createdAt: order.createdAt,
    })),
    adminRecentOrders: adminRecentOrders.map((order) => ({
      id: order.id,
      total: order.total || 0,
      createdAt: order.createdAt,
      customerName: order.User?.name || "Unknown",
      customerEmail: order.User?.email || "-",
    })),
    userRecentOrders: userRecentOrders.map((order) => ({
      id: order.id,
      total: order.total || 0,
      createdAt: order.createdAt,
    })),
  };
};

const adminJs = new AdminJS({
  componentLoader,

  locale: {
    translations: {
      labels: {
        Localhost: "",
      },
    },
  },

  pages: {
    mainDashboard: {
      label: "Dashboard",
      icon: "Home",
      component: Components.Dashboard,
      handler: getDashboardData,
    },
  },

  resources: [
    {
      resource: User,
      options: {
        navigation: {
          name: "User Management",
          icon: "User",
        },
        properties: {
          password: {
            isVisible: { list: false, filter: false, show: false, edit: true },
          },
        },
        actions: {
          list: {
            isAccessible: ({ currentAdmin }) =>
              currentAdmin?.role === "admin",
          },
          new: {
            before: async (request) => {
              if (request.payload && request.payload.password) {
                request.payload.password = await bcrypt.hash(
                  request.payload.password,
                  10
                );
              }
              return request;
            },
            isAccessible: ({ currentAdmin }) =>
              currentAdmin?.role === "admin",
          },
          edit: {
            before: async (request) => {
              if (request.payload && request.payload.password) {
                // If the user submits a new password, hash it.
                // Otherwise you might need logic to prevent overwriting with blank.
                request.payload.password = await bcrypt.hash(
                  request.payload.password,
                  10
                );
              }
              return request;
            },
            isAccessible: ({ currentAdmin }) =>
              currentAdmin?.role === "admin",
          },
          delete: {
            isAccessible: ({ currentAdmin }) =>
              currentAdmin?.role === "admin",
          },
        },
      },
    },
    {
      resource: Product,
      options: {
        navigation: {
          name: "Inventory",
          icon: "Box",
        },
        actions: {
          new: {
            isAccessible: ({ currentAdmin }) => currentAdmin?.role === "admin",
          },
          edit: {
            isAccessible: ({ currentAdmin }) => currentAdmin?.role === "admin",
          },
          delete: {
            isAccessible: ({ currentAdmin }) => currentAdmin?.role === "admin",
          },
        },
      },
    },
    {
      resource: Category,
      options: {
        navigation: {
          name: "Inventory",
          icon: "Bookmark",
        },
        actions: {
          new: {
            isAccessible: ({ currentAdmin }) => currentAdmin?.role === "admin",
          },
          edit: {
            isAccessible: ({ currentAdmin }) => currentAdmin?.role === "admin",
          },
          delete: {
            isAccessible: ({ currentAdmin }) => currentAdmin?.role === "admin",
          },
        },
      },
    },
    {
      resource: Order,
      options: {
        navigation: {
          name: "Sales",
          icon: "ShoppingCart",
        },
        actions: {
          new: {
            isAccessible: ({ currentAdmin }) => currentAdmin?.role === "admin",
          },
          edit: {
            isAccessible: ({ currentAdmin }) => currentAdmin?.role === "admin",
          },
          delete: {
            isAccessible: ({ currentAdmin }) => currentAdmin?.role === "admin",
          },
          list: {
            before: async (request, context) => {
              if (context.currentAdmin && context.currentAdmin.role !== "admin") {
                request.query = {
                  ...request.query,
                  "filters.UserId": context.currentAdmin.id,
                };
              }
              return request;
            },
          },
        },
      },
    },
    {
      resource: OrderItem,
      options: {
        navigation: {
          name: "Sales",
          icon: "List",
        },
        properties: {
          OrderId: {
            isVisible: { list: true, show: true, edit: false, filter: true },
          },
        },
        actions: {
          new: {
            before: async (request, context) => {
              if (request.method === "post") {
                const quantity = parseInt(request.payload.quantity) || 0;
                const productId = request.payload.ProductId;

                const product = await Product.findByPk(productId);
                if (product) {
                  const currentAdmin = context.currentAdmin;
                  
                  // create a new order automatically
                  const newOrder = await Order.create({
                    total: product.price * quantity,
                    UserId: currentAdmin.id,
                  });

                  request.payload.OrderId = newOrder.id;
                }
              }
              return request;
            },
          },
          list: {
            // We use after hook to filter out records manually, because of AdminJS adapter limitations with nested object queries via URL filters.
            after: async (response, request, context) => {
              if (context.currentAdmin && context.currentAdmin.role !== "admin") {
                const userOrders = await Order.findAll({ 
                  where: { UserId: context.currentAdmin.id } 
                });
                const orderIds = userOrders.map(o => o.id.toString());
                
                if (response.records) {
                  response.records = response.records.filter((record) => {
                    return orderIds.includes(record.params.OrderId?.toString());
                  });
                  response.meta.total = response.records.length;
                }
              }
              return response;
            },
          },
        },
      },
    },

    {
      resource: Setting,
      options: {
        navigation: {
          name: "System",
          icon: "Settings",
        },
        actions: {
          list: {
            isAccessible: ({ currentAdmin }) =>
              currentAdmin?.role === "admin",
          },
        },
      },
    },
  ],

  rootPath: "/admin",

  dashboard: {
    component: Components.Dashboard,
    handler: getDashboardData,
  },
});

if (process.env.NODE_ENV !== "production") {
  await adminJs.watch();
}

const adminRouter =
  AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
      authenticate: async (email, password) => {
        const user = await User.findOne({
          where: { email },
        });

        if (!user) return null;

        const matched = await bcrypt.compare(
          password,
          user.password
        );

        if (matched) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }

        return null;
      },

      cookiePassword: "supersecretcookie",
    }
  );

app.use("/api", authRoutes);
app.use(adminJs.options.rootPath, adminRouter);

sequelize.sync({ alter: true }).then(async () => {
  const ensureDefaultUser = async ({
    name,
    email,
    password,
    role,
  }) => {
    const existing = await User.findOne({ where: { email } });

    if (!existing) {
      await User.create({
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role,
      });
      return;
    }

    await existing.update({
      name,
      role,
    });
  };

  await ensureDefaultUser({
    name: "Admin",
    email: "admin@gmail.com",
    password: "admin123",
    role: "admin",
  });

  await ensureDefaultUser({
    name: "User",
    email: "user@gmail.com",
    password: "user123",
    role: "user",
  });

  app.listen(process.env.PORT, () => {
    console.log("Server running");
  });
});
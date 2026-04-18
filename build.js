import AdminJS from 'adminjs';
import AdminJSSequelize from '@adminjs/sequelize';
import { ComponentLoader } from 'adminjs';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

AdminJS.registerAdapter(AdminJSSequelize);

const componentLoader = new ComponentLoader();

componentLoader.add(
  "Dashboard",
  path.join(__dirname, "components", "AdminDashboard.jsx")
);

const adminJs = new AdminJS({
  componentLoader,
});

async function build() {
  await adminJs.initialize();
  console.log("Bundle built successfully");
  process.exit(0);
}

build();

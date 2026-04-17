import React, { useState, useEffect } from "react";
import { useCurrentAdmin, ApiClient } from "adminjs";
import { Badge, Box, H2, H4, Text, Loader } from "@adminjs/design-system";

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (dateValue) => {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const StatCard = ({ title, value, accent }) => (
  <Box
    bg="white"
    borderRadius="xl"
    p="xxl"
    boxShadow="card"
    minWidth="220px"
    flex="1"
    borderLeft={`6px solid ${accent}`}
  >
    <Text fontSize="xl" color="grey60" mb="lg" fontWeight="bold">
      {title}
    </Text>
    <Text fontSize="54px" fontWeight="100" color="grey100" style={{ letterSpacing: "-1px" }}>
      {value}
    </Text>
  </Box>
);

const GreetingCard = ({ isAdmin, personalInfo }) => (
  <Box
    mb="xxl"
    p="xxl"
    borderRadius="xl"
    boxShadow="card"
    style={{
      background: isAdmin
        ? "linear-gradient(120deg, #0f5f9e 0%, #2980b9 100%)"
        : "linear-gradient(120deg, #4b5cc4 0%, #6f7ce0 100%)",
      color: "#ffffff",
    }}
  >
    <Text fontSize="42px" fontWeight="bold" style={{ color: "#ffffff", lineHeight: 1.2 }}>
      {isAdmin ? "Welcome back, Admin" : "Welcome back, User"}
    </Text>
    <Text mt="lg" fontSize="xl" style={{ color: "#eaf4ff" }}>
      {personalInfo?.name && personalInfo?.name !== "-"
        ? `Signed in as ${personalInfo.name}`
        : "Have a productive session."}
    </Text>
  </Box>
);

const InfoCard = ({ personalInfo }) => (
  <Box bg="white" borderRadius="xl" boxShadow="card" p="xxl">
    <H4 mb="xl" style={{ fontSize: "36px", color: "#333", fontWeight: 600 }}>Personal Info</H4>
    <Box display="grid" style={{ gap: "16px" }}>
      <Text fontSize="xl">
        <strong style={{ color: "#555" }}>Name:</strong> {personalInfo?.name || "-"}
      </Text>
      <Text fontSize="xl">
        <strong style={{ color: "#555" }}>Email:</strong> {personalInfo?.email || "-"}
      </Text>
      <Text fontSize="xl" display="flex" alignItems="center">
        <strong style={{ color: "#555", marginRight: "8px" }}>Role:</strong> 
        <Badge size="lg" variant="primary" style={{ fontSize: "16px", padding: "4px 8px" }}>
          {personalInfo?.role || "user"}
        </Badge>
      </Text>
      <Text fontSize="xl">
        <strong style={{ color: "#555" }}>Joined:</strong> {formatDate(personalInfo?.joinedAt)}
      </Text>
    </Box>
  </Box>
);

const RecentOrders = ({ recentOrders = [], adminView = false }) => (
  <Box bg="white" borderRadius="xl" boxShadow="card" p="xxl">
    <H4 mb="xl" style={{ fontSize: "36px", color: "#333", fontWeight: 600 }}>Recent Orders</H4>
    {recentOrders.length === 0 ? (
      <Text color="grey60" fontSize="xl">No orders available yet.</Text>
    ) : (
      <Box display="grid" style={{ gap: "16px" }}>
        {recentOrders.map((order) => (
          <Box
            key={order.id}
            p="lg"
            border="1px solid"
            borderColor="grey20"
            borderRadius="lg"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            style={{ gap: "16px" }}
          >
            <Box>
              <Text fontWeight="bold" fontSize="24px" style={{ color: "#222" }}>Order #{order.id}</Text>
              <Text color="grey60" fontSize="lg" mt="sm">
                {formatDate(order.createdAt)}
              </Text>
              {adminView ? (
                <Text color="grey80" fontSize="lg" mt="sm">
                  <span style={{ fontWeight: 600 }}>{order.customerName}</span> ({order.customerEmail})
                </Text>
              ) : null}
            </Box>
            <Box>
              <Badge size="lg" variant="success" style={{ fontSize: "20px", padding: "8px 16px" }}>
                {formatCurrency(order.total)}
              </Badge>
            </Box>
          </Box>
        ))}
      </Box>
    )}
  </Box>
);

const AdminDashboard = (props) => {
  const [currentAdmin] = useCurrentAdmin();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = new ApiClient();
    
    // Fetch data from our dashboard/page handler
    api.getDashboard()
      .then((res) => {
        // AdminJS ApiClient sometimes returns the full Axios response, sometimes just the data payload
        const payload = res.data || res;
        setData(payload || {});
        setLoading(false);
      })
      .catch((err) => {
        // Fallback to fetch via page if getDashboard fails
        api.getPage("mainDashboard")
          .then((res) => {
            const payload = res.data || res;
            setData(payload || {});
            setLoading(false);
          })
          .catch((e) => {
            console.error("Error fetching dashboard data", e);
            setLoading(false);
          });
      });
  }, []);

  const {
    role,
    personalInfo,
    totalUsers,
    totalOrders,
    adminTotalOrders,
    userTotalOrders,
    totalRevenue,
    recentOrders,
    adminRecentOrders,
    userRecentOrders,
  } = data || {};

  const resolvedRole =
    currentAdmin?.role ||
    role ||
    (currentAdmin?.email === "admin@gmail.com" ? "admin" : "user");

  const isAdmin = resolvedRole === "admin";

  const effectivePersonalInfo = {
    ...personalInfo,
    name: personalInfo?.name !== "-" ? personalInfo?.name : currentAdmin?.name || "-",
    email: personalInfo?.email !== "-" ? personalInfo?.email : currentAdmin?.email || "-",
    role: resolvedRole,
  };

  const effectiveRecentOrders = isAdmin
    ? adminRecentOrders || recentOrders || []
    : userRecentOrders || recentOrders || [];

  const effectiveUserTotalOrders =
    userTotalOrders !== undefined ? userTotalOrders : totalOrders || 0;

  const effectiveAdminTotalOrders =
    adminTotalOrders !== undefined ? adminTotalOrders : totalOrders || 0;

  if (loading) {
    return (
      <Box p="xl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader />
      </Box>
    );
  }

  return (
    <Box
      p="xl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(120deg, #f8fbff 0%, #eef5ff 50%, #ffffff 100%)",
      }}
    >
      <Box mb="xl" display="flex" justifyContent="space-between" flexWrap="wrap">
        <H2 style={{ fontSize: "48px", lineHeight: 1.15 }}>
          {isAdmin ? "Admin Dashboard" : "User Dashboard"}
        </H2>
      </Box>

      <GreetingCard isAdmin={isAdmin} personalInfo={effectivePersonalInfo} />

      <Box display="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {isAdmin ? (
          <>
            <StatCard title="Total Users" value={totalUsers || 0} accent="#1f73b7" />
            <StatCard title="Total Orders" value={effectiveAdminTotalOrders} accent="#0f9d84" />
            <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} accent="#f39c12" />
          </>
        ) : (
          <StatCard title="My Total Orders" value={effectiveUserTotalOrders} accent="#3f51b5" />
        )}
      </Box>

      <Box mt="xl" display="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "24px" }}>
        <InfoCard personalInfo={effectivePersonalInfo} />
        <RecentOrders recentOrders={effectiveRecentOrders} adminView={isAdmin} />
      </Box>
    </Box>
  );
};

export default AdminDashboard;
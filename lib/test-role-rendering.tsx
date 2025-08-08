import React from "react";
import { User, Role } from "@/utils/api/types";

// Test component to verify role rendering
export function TestRoleRendering() {
  // Mock user data
  const mockUser: User = {
    id: 1,
    username: "admin_user",
    email: "admin@smartparking.com",
    phone: "+1234567890",
    profile_photo: null,
    address: "123 Main St",
    gender: "male",
    date_of_birth: "1990-01-01",
    last_login: "2024-01-01T00:00:00Z",
    email_verified_at: "2024-01-01T00:00:00Z",
    role_id: 1,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    role: {
      id: 1,
      name: "admin",
      description: "Administrator",
      level: 1,
      is_default: false,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      deleted_at: null,
    },
    permissions: [],
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Role Rendering Test</h2>

      <div className="space-y-2">
        <h3 className="font-semibold">User Information:</h3>
        <p>
          <strong>Username:</strong> {mockUser.username}
        </p>
        <p>
          <strong>Email:</strong> {mockUser.email}
        </p>
        <p>
          <strong>Role Name:</strong> {mockUser.role.name}
        </p>
        <p>
          <strong>Role Level:</strong> {mockUser.role.level}
        </p>
        <p>
          <strong>Role Description:</strong> {mockUser.role.description}
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Role Comparisons:</h3>
        <p>Is Admin: {mockUser.role.name === "admin" ? "Yes" : "No"}</p>
        <p>Is Manager: {mockUser.role.name === "manager" ? "Yes" : "No"}</p>
        <p>Is Operator: {mockUser.role.name === "operator" ? "Yes" : "No"}</p>
        <p>Role Level ≤ 2: {mockUser.role.level <= 2 ? "Yes" : "No"}</p>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Navigation Logic:</h3>
        <p>
          Should go to:{" "}
          {mockUser.role.level <= 2
            ? "/manager/dashboard"
            : "/operator/dashboard"}
        </p>
      </div>
    </div>
  );
}

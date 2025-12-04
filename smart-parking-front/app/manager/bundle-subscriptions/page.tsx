"use client";

import { useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion } from "framer-motion";
import { UserCheck } from "lucide-react";
import { BundleSubscriptionsTable } from "./components/bundle-subscriptions-table";

export default function BundleSubscriptionsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gradient">Bundle Subscriptions</h1>
            <p className="text-muted-foreground mt-2">
              Manage customer bundle subscriptions and track usage
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <BundleSubscriptionsTable />
        </motion.div>
      </div>
    </MainLayout>
  );
}

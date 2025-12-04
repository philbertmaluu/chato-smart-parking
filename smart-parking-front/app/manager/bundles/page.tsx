"use client";

import { useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion } from "framer-motion";
import { Package } from "lucide-react";
import {
  useBundleTypes,
  type BundleType,
} from "../settings/hooks/use-bundle-types";
import { BundlesTable } from "./components/bundles-table";

export default function BundlesPage() {
  const { bundleTypes, fetchBundleTypes } = useBundleTypes();
  
  useEffect(() => {
    fetchBundleTypes?.();
  }, [fetchBundleTypes]);

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
            <h1 className="text-3xl font-bold text-gradient">Bundles</h1>
            <p className="text-muted-foreground mt-2">
              Manage pricing bundles for frequent customers
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <BundlesTable bundleTypes={bundleTypes || []} />
        </motion.div>
      </div>
    </MainLayout>
  );
}
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProductTransfer" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CashRegister" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CashOrder" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BankAccount" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BankOrder" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProductReceipt" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProductIssue" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "userEmail" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "Product_quantityOnHand_idx" ON "Product"("quantityOnHand");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "InventoryLog_productId_createdAt_idx" ON "InventoryLog"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "SystemLog_createdAt_idx" ON "SystemLog"("createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_warehouseId_createdAt_idx" ON "StockMovement"("warehouseId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_productId_idx" ON "StockMovement"("productId");

-- CreateIndex
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");

-- CreateIndex
CREATE INDEX "Batch_productId_status_idx" ON "Batch"("productId", "status");

-- CreateIndex
CREATE INDEX "Batch_productId_expiryDate_idx" ON "Batch"("productId", "expiryDate");

-- CreateIndex
CREATE INDEX "ProductTransfer_status_idx" ON "ProductTransfer"("status");

-- CreateIndex
CREATE INDEX "ProductTransfer_fromWarehouseId_idx" ON "ProductTransfer"("fromWarehouseId");

-- CreateIndex
CREATE INDEX "ProductTransfer_toWarehouseId_idx" ON "ProductTransfer"("toWarehouseId");

-- CreateIndex
CREATE INDEX "ProductTransfer_number_idx" ON "ProductTransfer"("number");

-- CreateIndex
CREATE INDEX "ExpiryAlert_batchId_isResolved_idx" ON "ExpiryAlert"("batchId", "isResolved");

-- CreateIndex
CREATE INDEX "ExpiryAlert_severity_idx" ON "ExpiryAlert"("severity");

-- CreateIndex
CREATE INDEX "ExpiryAlert_productId_idx" ON "ExpiryAlert"("productId");

-- CreateIndex
CREATE INDEX "ExpiryAlert_isResolved_idx" ON "ExpiryAlert"("isResolved");

-- CreateIndex
CREATE INDEX "Employee_department_idx" ON "Employee"("department");

-- CreateIndex
CREATE INDEX "Employee_isActive_idx" ON "Employee"("isActive");

-- CreateIndex
CREATE INDEX "Document_type_posted_date_idx" ON "Document"("type", "posted", "date");

-- CreateIndex
CREATE INDEX "Document_customerId_idx" ON "Document"("customerId");

-- CreateIndex
CREATE INDEX "Document_number_idx" ON "Document"("number");

-- CreateIndex
CREATE INDEX "Document_createdById_idx" ON "Document"("createdById");

-- CreateIndex
CREATE INDEX "ProductReceipt_status_date_idx" ON "ProductReceipt"("status", "date");

-- CreateIndex
CREATE INDEX "ProductReceipt_supplierId_idx" ON "ProductReceipt"("supplierId");

-- CreateIndex
CREATE INDEX "ProductReceipt_warehouseId_idx" ON "ProductReceipt"("warehouseId");

-- CreateIndex
CREATE INDEX "ProductReceipt_number_idx" ON "ProductReceipt"("number");

-- CreateIndex
CREATE INDEX "ProductIssue_status_date_type_idx" ON "ProductIssue"("status", "date", "type");

-- CreateIndex
CREATE INDEX "ProductIssue_warehouseId_idx" ON "ProductIssue"("warehouseId");

-- CreateIndex
CREATE INDEX "ProductIssue_number_idx" ON "ProductIssue"("number");

-- CreateIndex
CREATE INDEX "Task_assignedToId_status_idx" ON "Task"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");


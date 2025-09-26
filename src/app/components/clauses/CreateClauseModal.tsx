"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Loader2 } from "lucide-react"
import { clausesApi } from "@/services/api"

interface CreateClauseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  clause_code: string
  title: string
  type: string
  content: string
  is_active: boolean
}

interface FormErrors {
  clause_code?: string
  title?: string
  type?: string
  content?: string
}

export function CreateClauseModal({ isOpen, onClose, onSuccess }: CreateClauseModalProps) {
  const [formData, setFormData] = useState<FormData>({
    clause_code: "",
    title: "",
    type: "",
    content: "",
    is_active: true,
  })

  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFormChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!formData.clause_code.trim()) {
      errors.clause_code = "Clause code is required"
    }

    if (!formData.title.trim()) {
      errors.title = "Title is required"
    }

    if (!formData.type.trim()) {
      errors.type = "Type is required"
    }

    if (!formData.content.trim()) {
      errors.content = "Content is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateClause = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      console.log(formData)
      clausesApi.createClause(formData)
      handleCloseCreateDialog()
      onSuccess()
    } catch (error) {
      console.error("Error creating clause:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseCreateDialog = () => {
    setFormData({
      clause_code: "",
      title: "",
      type: "",
      content: "",
      is_active: true,
    })
    setFormErrors({})
    setIsSubmitting(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseCreateDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Create New Clause</DialogTitle>
          <DialogDescription className="mt-2">
            Fill in the details to create a new clause template
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clause Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Clause Code *</label>
              <Input
                value={formData.clause_code}
                onChange={(e) => handleFormChange("clause_code", e.target.value)}
                placeholder="e.g., PAYMENT_001"
                className={`bg-white ${formErrors.clause_code ? "border-red-500" : "border-gray-300"}`}
              />
              {formErrors.clause_code && <p className="text-sm text-red-600">{formErrors.clause_code}</p>}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                placeholder="e.g., Standard Payment Terms"
                className={`bg-white ${formErrors.title ? "border-red-500" : "border-gray-300"}`}
              />
              {formErrors.title && <p className="text-sm text-red-600">{formErrors.title}</p>}
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Type *</label>
            <Input
              value={formData.type}
              onChange={(e) => handleFormChange("type", e.target.value)}
              placeholder="e.g., Payment, Legal, Terms"
              className={`bg-white ${formErrors.type ? "border-red-500" : "border-gray-300"}`}
            />
            {formErrors.type && <p className="text-sm text-red-600">{formErrors.type}</p>}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => handleFormChange("content", e.target.value)}
              placeholder="Enter the detailed clause content..."
              rows={6}
              className={`w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 ${formErrors.content ? "border-red-500" : "border-gray-300"
                }`}
            />
            {formErrors.content && <p className="text-sm text-red-600">{formErrors.content}</p>}
          </div>

          {/* Active Status Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleFormChange("is_active", true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${formData.is_active
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => handleFormChange("is_active", false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${!formData.is_active ? "bg-red-500 text-white shadow-md" : "bg-red-100 text-red-600 hover:bg-red-200"
                  }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button className="bg-white text-black hover:bg-gray-50" onClick={handleCloseCreateDialog}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateClause}
            disabled={isSubmitting}
            className="bg-gray-900 hover:bg-gray-800 text-white"
            style={{ backgroundColor: "#137fec", color: "#fff" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Clause
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

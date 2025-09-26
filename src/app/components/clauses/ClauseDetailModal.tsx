"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ClauseTemplate {
  id: number
  clause_code: string
  title: string
  type: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ClauseDetailModalProps {
  clause: ClauseTemplate | null
  isOpen: boolean
  onClose: () => void
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  })
}

export function ClauseDetailModal({ clause, isOpen, onClose }: ClauseDetailModalProps) {
  if (!clause) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{clause.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">Clause Details and Information</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clause ID</p>
                <p className="text-foreground">{clause.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="text-foreground">{clause.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge
                  className={
                    clause.is_active
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  }
                >
                  {clause.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="text-foreground">{formatDate(clause.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Modified</p>
                <p className="text-foreground">{formatDate(clause.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Clause Content */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Clause Content</h3>
            <Card>
              <CardContent className="pt-4">
                <div className="whitespace-pre-wrap text-sm text-foreground bg-muted/30 p-4 rounded-md">
                  {clause.content}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-600">This clause has been used in 0 contracts.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Version History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-600">Current version: 1.0</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button className="bg-white text-black hover:bg-gray-50" onClick={onClose}>
            Close
          </Button>
          <Button className="text-white hover:bg-gray-800" style={{ backgroundColor: "#137fec", color: "#fff" }}>Edit Clause</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

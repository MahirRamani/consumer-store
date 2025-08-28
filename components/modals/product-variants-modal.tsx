"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Package, Weight, Ruler, Barcode } from "lucide-react"
import type { SubProduct } from "@/lib/types"

interface ProductVariantsModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  onAddToCart?: (variant: SubProduct, quantity: number) => void
}

export function ProductVariantsModal({
  isOpen,
  onClose,
  productId,
  productName,
  onAddToCart,
}: ProductVariantsModalProps) {
  const [variants, setVariants] = useState<SubProduct[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && productId) {
      fetchVariants()
    }
  }, [isOpen, productId])

  const fetchVariants = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/products/${productId}/variants`)
      if (response.ok) {
        const data = await response.json()
        setVariants(data.variants)
      }
    } catch (error) {
      console.error("Error fetching variants:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (variant: SubProduct) => {
    if (onAddToCart) {
      onAddToCart(variant, 1)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {productName} - Variants
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {variants.map((variant) => (
              <Card key={variant.id} className="relative">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{variant.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {variant.size}
                    </Badge>
                    <Badge variant={variant.stock > variant.lowStockThreshold ? "default" : "destructive"}>
                      Stock: {variant.stock}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold text-primary">₹{variant.price}</div>

                  {variant.description && <p className="text-sm text-muted-foreground">{variant.description}</p>}

                  <div className="space-y-1 text-sm">
                    {variant.weight && (
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <span>Weight: {variant.weight}</span>
                      </div>
                    )}
                    {variant.volume && (
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span>Volume: {variant.volume}</span>
                      </div>
                    )}
                    {variant.sku && (
                      <div className="flex items-center gap-2">
                        <Barcode className="h-4 w-4 text-muted-foreground" />
                        <span>SKU: {variant.sku}</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button onClick={() => handleAddToCart(variant)} disabled={variant.stock === 0} className="w-full">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {variant.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {!loading && variants.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No variants found for this product.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}

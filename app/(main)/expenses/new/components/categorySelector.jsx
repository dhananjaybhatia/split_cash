"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

const CategorySelector = ({ categories, onChange }) => {
  const [selectedCategory, setSelectedCategory] = useState("");

  // Set default category whenever categories change
  useEffect(() => {
    if (categories?.length > 0 && !selectedCategory) {
      const defaultCategory =
        categories.find((cat) => cat.isDefault) || categories[0];
      setSelectedCategory(defaultCategory.id);
      onChange?.(defaultCategory.id);
    }
  }, [categories, selectedCategory, onChange]); // Proper dependencies

  if (!categories || categories.length === 0) {
    return <div>No categories available</div>;
  }

  const handleCategoryChange = (categoryId) => {
    if (categoryId !== selectedCategory) {
      setSelectedCategory(categoryId);
      onChange?.(categoryId);
    }
  };

  return (
    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            <div className="flex items-center gap-2">
              <span>{category.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CategorySelector;

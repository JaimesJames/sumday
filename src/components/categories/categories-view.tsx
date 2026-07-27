"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/react";
import { categorySchema } from "@/server/validators/category";

type CategoryFormValues = z.infer<typeof categorySchema>;
type Category = { id: string; name: string; color: string };

export function CategoriesView() {
  const { data: categories = [], isLoading } = trpc.category.list.useQuery();
  const utils = trpc.useUtils();

  const createForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", color: "#8B5CF6" },
  });

  const createCategory = trpc.category.create.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      createForm.reset();
    },
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Create category</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={createForm.handleSubmit((values) => createCategory.mutate(values))}
            className="space-y-3"
          >
            <Input placeholder="Category name" {...createForm.register("name")} />
            {createForm.formState.errors.name && (
              <p className="text-sm text-red-500">{createForm.formState.errors.name.message}</p>
            )}
            <div className="space-y-1">
              <Label htmlFor="color">Color</Label>
              <Input id="color" type="color" {...createForm.register("color")} />
            </div>
            <Button type="submit" className="rounded-full" disabled={createCategory.isPending}>
              {createCategory.isPending ? "Adding..." : "Add category"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Your categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-slate-500">Loading categories...</p>}
          {categories.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const utils = trpc.useUtils();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category.name, color: category.color },
  });

  const updateCategory = trpc.category.update.useMutation({
    onSuccess: () => utils.category.list.invalidate(),
  });
  const deleteCategory = trpc.category.delete.useMutation({
    onSuccess: () => utils.category.list.invalidate(),
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => updateCategory.mutate({ id: category.id, ...values }))}
      className="rounded-2xl border bg-white p-3 space-y-2"
    >
      <div className="flex items-center gap-2">
        <Badge style={{ backgroundColor: category.color }}>{category.name}</Badge>
      </div>
      <Input {...form.register("name")} />
      <Input type="color" {...form.register("color")} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="rounded-full" disabled={updateCategory.isPending}>
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="rounded-full"
          disabled={deleteCategory.isPending}
          onClick={() => deleteCategory.mutate({ id: category.id })}
        >
          Delete
        </Button>
      </div>
    </form>
  );
}

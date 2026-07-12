import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/(protected)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/server/auth/session";
import { listCategories } from "@/server/services/category-service";

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await listCategories(user.id);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Create category</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCategoryAction} className="space-y-3">
            <Input name="name" placeholder="Category name" required />
            <div className="space-y-1">
              <Label htmlFor="color">Color</Label>
              <Input id="color" type="color" name="color" defaultValue="#8B5CF6" required />
            </div>
            <Button type="submit" className="rounded-full">Add category</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Your categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category) => (
            <form
              key={category.id}
              action={updateCategoryAction}
              className="rounded-2xl border bg-white p-3 space-y-2"
            >
              <input type="hidden" name="id" value={category.id} />
              <div className="flex items-center gap-2">
                <Badge style={{ backgroundColor: category.color }}>{category.name}</Badge>
              </div>
              <Input name="name" defaultValue={category.name} required />
              <Input type="color" name="color" defaultValue={category.color} required />
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="rounded-full">
                  Save
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="destructive"
                  formAction={deleteCategoryAction}
                  className="rounded-full"
                >
                  Delete
                </Button>
              </div>
            </form>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

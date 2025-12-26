import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Only projects with 7-14 day deliverables will appear.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-400">
          <p>Publish a project and review incoming applications here.</p>
          <Button size="sm" variant="outline">
            Create project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

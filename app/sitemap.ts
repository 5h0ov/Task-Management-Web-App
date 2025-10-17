```typescript
import { type MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ["", "/privacy", "/terms"].map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date().toISOString(),
  }));

  return [...routes];
}

// Meta Title and Description
const metaTitle = "TaskFlow - Best Personal Task Management System Online";
const metaDescription = "Efficiently organize your tasks and projects with TaskFlow, the best personal task management system. Boost productivity and stay on top of your schedule with ease.";

// Image Alt Text (Assuming images are added elsewhere in the application)
// Example: <img src="image-url.jpg" alt="TaskFlow dashboard showing task management features">
```
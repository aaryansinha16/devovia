import { BlogEditor } from "./editor";

export const metadata = {
  title: "Edit Blog Post | Devovia",
  description: "Edit your blog post on Devovia",
};

// Use this approach to properly handle the params in Next.js App Router
export default function Page({ params }: { params: { id: string } }) {
  // Access params directly since this isn't an async function
  const { id } = params;
  
  // We can add server-side data fetching here in the future
  // const blogData = await fetchBlogData(id);
  
  return <BlogEditor id={id} />;
}

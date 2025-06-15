import { BlogEditor } from "./editor";

export const metadata = {
  title: "Edit Blog Post | Devovia",
  description: "Edit your blog post on Devovia",
};

// Use this approach instead of destructuring to avoid type issues
export default async function Page(props: any) {
  const id = props.params?.id;
  
  // We can add server-side data fetching here in the future
  // const blogData = await fetchBlogData(id);
  
  return <BlogEditor id={id} />;
}

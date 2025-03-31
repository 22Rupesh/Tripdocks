
'use client';

import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [post, setPost] = useState("");

  const onChange = (content:string) =>{
    setPost(content);
    console.log(content)
  }
  return (
    <div className="max-w-3xl mx-auto py-10">
      <RichTextEditor content={post} onChange={onChange}/>
    </div>
  );
}

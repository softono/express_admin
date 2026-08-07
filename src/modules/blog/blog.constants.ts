export const BLOG_CATEGORIES = [
  { label: "Machine Learning", value: "machine-learning" },
  { label: "Deep Learning", value: "deep-learning" },
  {
    label: "Natural Language Processing",
    value: "natural-language-processing",
  },
  { label: "Computer Vision", value: "computer-vision" },
  { label: "Generative AI", value: "generative-ai" },
  { label: "AI Ethics", value: "ai-ethics" },
  { label: "Robotics", value: "robotics" },
  { label: "AI Tools", value: "ai-tools" },
] as const;

export const BLOG_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const BLOG_STATUS_LABEL = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "destructive" },
} as const;

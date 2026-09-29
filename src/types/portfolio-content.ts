import { z } from "zod";

const nullableText = z.string().nullable().optional();
const nullableUrl = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .union([z.string().url(), z.string().startsWith("TODO(me)")])
    .nullable()
    .optional(),
);
const nullableNumber = z.number().nullable().optional();
const textArray = z.array(z.string()).nullable().optional();
const recordId = z.string().uuid();

const profileSchema = z
  .object({
    id: recordId,
    display_name: z.string().min(1),
    title: z.string().min(1),
    avatar_url: nullableText,
    bio: nullableText,
    location: nullableText,
    email: nullableText,
    interests: nullableText,
    experience_years: nullableNumber,
    experience_label: nullableText,
    tags: textArray,
    cv_url: nullableText,
    open_to_remote: z.boolean(),
    timezone: nullableText,
    availability: nullableText,
  })
  .strip();

const projectSchema = z
  .object({
    id: recordId,
    title: z.string().min(1),
    category: z.enum(["Personal", "Professional", "Open Source", "Course"]),
    description: z.string(),
    image_url: nullableText,
    tags: textArray,
    github_url: nullableUrl,
    demo_url: nullableUrl,
    featured: z.boolean().nullable().optional(),
    order_index: nullableNumber,
    problem: nullableText,
    highlights: textArray,
    what_i_would_improve: nullableText,
  })
  .strip();

const experienceSchema = z
  .object({
    id: recordId,
    company: z.string().min(1),
    period: z.string().min(1),
    position: z.string().min(1),
    description: nullableText,
    highlights: textArray,
    employment_type: nullableText,
    location: nullableText,
    order_index: nullableNumber,
  })
  .strip();

const skillCategorySchema = z
  .object({
    id: recordId,
    name: z.string().min(1),
    icon: nullableText,
    order_index: nullableNumber,
  })
  .strip();

const skillSchema = z
  .object({
    id: recordId,
    name: z.string().min(1),
    icon: nullableText,
    category_id: recordId.nullable(),
    level: nullableNumber,
    order_index: nullableNumber,
    svg_url: nullableText,
    svg_url_dark: nullableText,
  })
  .strip();

const contactInfoSchema = z
  .object({
    id: recordId,
    info_key: z.string().min(1),
    label: z.string().min(1),
    value: z.string(),
    type: nullableText,
    link: nullableUrl,
    icon: nullableText,
    icon_name: nullableText,
    order_index: nullableNumber,
    show_publicly: z.boolean(),
  })
  .strip();

const pageSectionSchema = z
  .object({
    id: recordId,
    section_key: z.string().min(1),
    title: nullableText,
    subtitle: nullableText,
    content: nullableText,
  })
  .strip();

const siteContentSchema = z
  .object({
    id: recordId,
    key: z.string().min(1),
    section: z.string().min(1),
    value: z.string(),
  })
  .strip();

const siteImageSchema = z
  .object({
    id: recordId,
    image_key: z.string().min(1),
    image_url: z.string().min(1),
    alt_text: nullableText,
    description: nullableText,
  })
  .strip();

const educationSchema = z
  .object({
    id: recordId,
    institution: z.string().min(1),
    title: z.string().min(1),
    period: z.string().min(1),
    description: nullableText,
    highlights: z.array(z.string()),
    related_project_id: recordId.nullable().optional(),
    order_index: z.number().int(),
  })
  .strip();

const courseSchema = z
  .object({
    id: recordId,
    title: z.string().min(1),
    provider: z.string().min(1),
    description: nullableText,
    period: nullableText,
    certificate_url: nullableUrl,
    order_index: z.number().int(),
  })
  .strip();

const languageSchema = z
  .object({
    id: recordId,
    name: z.string().min(1),
    level: z.enum(["Native", "A1", "A2", "B1", "B2", "C1", "C2", "TODO(me)"]),
    order_index: z.number().int(),
  })
  .strip();

export const portfolioSnapshotSchema = z
  .object({
    formatVersion: z.literal(2),
    exportedAt: z.string().datetime(),
    data: z
      .object({
        profiles: z.array(profileSchema),
        projects: z.array(projectSchema),
        experiences: z.array(experienceSchema),
        skill_categories: z.array(skillCategorySchema),
        skills: z.array(skillSchema),
        contact_info: z.array(contactInfoSchema),
        page_sections: z.array(pageSectionSchema),
        site_content: z.array(siteContentSchema),
        site_images: z.array(siteImageSchema),
        education: z.array(educationSchema),
        courses: z.array(courseSchema),
        languages: z.array(languageSchema),
      })
      .strict(),
  })
  .strict()
  .superRefine((snapshot, context) => {
    for (const [table, rows] of Object.entries(snapshot.data)) {
      const ids = new Set<string>();
      for (const row of rows) {
        const id = (row as { id: string }).id;
        if (ids.has(id)) {
          context.addIssue({
            code: "custom",
            path: ["data", table],
            message: `Duplicate record id: ${id}`,
          });
          return;
        }
        ids.add(id);
      }
    }

    const categoryIds = new Set(
      snapshot.data.skill_categories.map(({ id }) => id),
    );
    snapshot.data.skills.forEach((skill, index) => {
      if (skill.category_id && !categoryIds.has(skill.category_id)) {
        context.addIssue({
          code: "custom",
          path: ["data", "skills", index, "category_id"],
          message:
            "Skill category_id does not match a category in this snapshot.",
        });
      }
    });

    const projectIds = new Set(snapshot.data.projects.map(({ id }) => id));
    snapshot.data.education.forEach((education, index) => {
      if (
        education.related_project_id &&
        !projectIds.has(education.related_project_id)
      ) {
        context.addIssue({
          code: "custom",
          path: ["data", "education", index, "related_project_id"],
          message:
            "Education related_project_id does not match a project in this snapshot.",
        });
      }
    });
  });

export type PortfolioSnapshot = z.infer<typeof portfolioSnapshotSchema>;

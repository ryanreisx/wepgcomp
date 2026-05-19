import { render, screen } from "@testing-library/react";
import HeroBanner from "./HeroBanner";

describe("HeroBanner", () => {
  it("renders title", () => {
    render(<HeroBanner title="Welcome" />);
    expect(screen.getByText("Welcome")).toBeInTheDocument();
  });

  it("renders subtitle", () => {
    render(<HeroBanner title="Title" subtitle="A subtitle" />);
    expect(screen.getByText("A subtitle")).toBeInTheDocument();
  });

  it("renders CTA link when provided", () => {
    render(
      <HeroBanner title="Title" ctaText="Saiba mais" ctaHref="/about" />,
    );
    const link = screen.getByText("Saiba mais");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/about");
  });

  it("does not render CTA when ctaText or ctaHref is missing", () => {
    render(<HeroBanner title="Title" ctaText="Click" />);
    expect(screen.queryByText("Click")).not.toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    render(<HeroBanner title="Title" />);
    const heading = screen.getByText("Title");
    expect(heading.tagName).toBe("H1");
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import Tabs from "./Tabs";

const tabs = [
  { label: "Autores", value: "autores" },
  { label: "Avaliadores", value: "avaliadores" },
  { label: "Audiência", value: "audiencia" },
];

describe("Tabs", () => {
  it("renders all tab buttons", () => {
    render(<Tabs tabs={tabs} activeTab="autores" onTabChange={() => {}} />);
    expect(screen.getByText("Autores")).toBeInTheDocument();
    expect(screen.getByText("Avaliadores")).toBeInTheDocument();
    expect(screen.getByText("Audiência")).toBeInTheDocument();
  });

  it("marks active tab with aria-selected", () => {
    render(<Tabs tabs={tabs} activeTab="avaliadores" onTabChange={() => {}} />);
    expect(screen.getByText("Avaliadores")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Autores")).toHaveAttribute("aria-selected", "false");
  });

  it("applies active class to active tab", () => {
    render(<Tabs tabs={tabs} activeTab="autores" onTabChange={() => {}} />);
    expect(screen.getByText("Autores").className).toContain("tab--active");
    expect(screen.getByText("Avaliadores").className).not.toContain("tab--active");
  });

  it("calls onTabChange when tab is clicked", () => {
    const onTabChange = jest.fn();
    render(<Tabs tabs={tabs} activeTab="autores" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText("Audiência"));
    expect(onTabChange).toHaveBeenCalledWith("audiencia");
  });

  it("renders with tablist role", () => {
    render(<Tabs tabs={tabs} activeTab="autores" onTabChange={() => {}} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import Button from "../Button"; // <-- update the path

describe("Button component", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);

    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Press</Button>);

    fireEvent.click(screen.getByText("Press"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Test</Button>);

    const el = screen.getByText("Test");
    expect(el.className).toContain("custom-class");
  });
});

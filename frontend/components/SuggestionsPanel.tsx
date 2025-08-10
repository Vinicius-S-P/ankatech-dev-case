import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SuggestionsPanel() {
  const suggestions = [
    "Review your investment allocations for diversification.",
    "Consider increasing your emergency fund to cover 6 months of expenses.",
    "Explore tax-advantaged retirement accounts like a 401k or IRA.",
    "Analyze your spending habits to identify areas for potential savings.",
    "Set up automated transfers to your savings and investment accounts.",
    "Research different insurance options to ensure adequate coverage.",
    "Plan for major life events like buying a home or starting a family.",
    "Evaluate your debt and consider strategies for accelerated repayment.",
    "Stay informed about market trends and economic indicators.",
    "Update your financial goals and track your progress regularly.",
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Suggestions</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Financial Suggestions</SheetTitle>
          <SheetDescription>
            Here are some personalized suggestions to improve your financial health.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <ScrollArea className="h-[calc(100vh-150px)] pr-4">
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="rounded-md border p-4 text-sm">
                {suggestion}
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
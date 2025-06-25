import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-ios-gray flex flex-col">
      <div className="h-6 bg-white"></div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-12">
          <h1 className="text-ios-large-title font-bold text-black mb-4">
            MyRoommate
          </h1>
          <p className="text-ios-body text-ios-gray-5 max-w-sm">
            Simplify shared living with your roommates. Manage chores, split
            expenses, and stay connected.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4 mb-8">
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-ios-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-ios-body">✓</span>
                </div>
                <div>
                  <h3 className="text-ios-headline font-semibold text-black">
                    Smart Chores
                  </h3>
                  <p className="text-ios-footnote text-ios-gray-5">
                    Auto-rotating assignments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-ios-green rounded-full flex items-center justify-center">
                  <span className="text-white text-ios-body">$</span>
                </div>
                <div>
                  <h3 className="text-ios-headline font-semibold text-black">
                    Easy Expenses
                  </h3>
                  <p className="text-ios-footnote text-ios-gray-5">
                    Split bills instantly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-ios-orange rounded-full flex items-center justify-center">
                  <span className="text-white text-ios-body">💬</span>
                </div>
                <div>
                  <h3 className="text-ios-headline font-semibold text-black">
                    Stay Connected
                  </h3>
                  <p className="text-ios-footnote text-ios-gray-5">
                    Real-time group chat
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={handleLogin}
          className="w-full max-w-sm bg-ios-blue hover:bg-ios-blue/90 text-white py-4 rounded-lg font-medium"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}

import { FC } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

interface SignatureStepProps {
  signatureCanvasRef: React.RefObject<any>;
  setSignatureSaved: (saved: boolean) => void;
}

const SignatureStep: FC<SignatureStepProps> = ({
  signatureCanvasRef,
  setSignatureSaved,
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">
        <span className="text-orange-500">Step 7 : </span> Signed & stamp
      </h2>
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Please sign below:
        </label>
        <SignatureCanvas
          ref={signatureCanvasRef}
          penColor="black"
          canvasProps={{
            className:
              "w-full h-48 border-2 border-dashed border-gray-300 rounded-md cursor-crosshair bg-gray-50",
          }}
          onEnd={() => setSignatureSaved(true)}
        />
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              signatureCanvasRef.current?.clear();
              setSignatureSaved(false);
            }}
          >
            <Eraser className="w-4 h-4 mr-2" />
            Clear Signature
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignatureStep;

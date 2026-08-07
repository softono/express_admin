import app from "@/app";
import config from "@/config";
import { infoLog } from "@/lib/logger";

app.listen(config.PORT, () => {
  infoLog(`API listening on http://localhost:${config.PORT}`);
});

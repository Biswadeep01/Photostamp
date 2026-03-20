from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from stegano import lsb
from PIL import Image
import io
import json

app = FastAPI()

# Allow your React app to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace "*" with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/watermark/")
async def create_watermark(
    file: UploadFile = File(...),
    name: str = Form(...),
    email: str = Form(...),
    address: str = Form(...),
    location: str = Form(...),
    date: str = Form(...) # <--- ADD THIS LINE
):
    # Compile details into a JSON payload
    details = {
        "author": name,
        "email": email,
        "address": address,
        "location": location,
        "date": date # <--- ADD THIS LINE
    }
    payload = json.dumps(details)
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data))
    if image.mode != 'RGB':
        image = image.convert('RGB')
    secret_image = lsb.hide(image, payload)
    img_byte_arr = io.BytesIO()
    secret_image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)

    return StreamingResponse(img_byte_arr, media_type="image/png", headers={
        "Content-Disposition": f"attachment; filename=watermarked_{file.filename.split('.')[0]}.png"
    })
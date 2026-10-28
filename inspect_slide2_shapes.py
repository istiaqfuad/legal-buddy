import pptx
prs = pptx.Presentation('/home/istiaqfuad/Desktop/gigalogy_project/backend_architecture_presentation.pptx')
slide = prs.slides[2]
print("Shapes on Slide 2:")
for shape in slide.shapes:
    print(f"Name: {shape.name}, type: {shape.shape_type}")

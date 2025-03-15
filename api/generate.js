export async function generateResponse(avatarId, userMessage) {
    try {
        const response = await fetch("/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ avatarId, userMessage }),
        });

        const text = await response.text(); // Get raw response

        if (!response.ok) {
            console.error("Server Error:", text);
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = JSON.parse(text); // Parse JSON safely
        return data.reply || "Oops! Something went wrong. Try again!";
    } catch (error) {
        console.error("Error generating response:", error);
        return "Sorry, I encountered an error. Please try again.";
    }
}


import express from 'express';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());

//Creating end point
app.get('/', (req, res)=> {
    res.json({message: 'OK'});
});

app.get('/chat', (req, res)=> {
   
    //SSE (Server Side Events)
    //1: Add special header
        res.writeHead(200, {
          'Content-Type': 'text/event-stream'    
        });
        
        setInterval(() => {
            res.write("event: cgPing\n")
            res.write("data: Happy Coding\n\n ")
            
        }, 1000);

    //2: Send data in special format
        
    res.json({});
});

const PORT = process.env.PORT || 4100
app.listen(PORT, ()=> console.log(`Server is running on http://localhost:${PORT}`));




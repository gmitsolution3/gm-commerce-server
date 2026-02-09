import { Request, Response } from "express";
import { createMarqueeService, deleteMarquee, getAllMarqueeService, getMarqueeService, toggleMarqueeStatusService, updateMarqueeService } from "../services/marquee.service";
import { ObjectId, ResumeToken } from "mongodb";

export const createMarqueeController = async (req: Request, res: Response) => {
  const data = req.body;
  try {
    const { createdAt, updatedAt, ...payload } = data;

    const finalPayload = {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await createMarqueeService(finalPayload);

    if (!result) {
      return res.status(500).json({
        success: false,
        message: "Something was wrong!!!",
      });
    }

    res.status(201).json({
      success: true,
      message: "Data is inserted",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const getMarqueeController = async(req:Request, res:Response)=>{
    try{
        const result = await getMarqueeService()

        if(!result){
            return res.status(404).json({
                success: false,
                message: "Marquee not found in db"
            })
        }

        res.status(200).json({
            success: true, 
            message: "Marquee found in db",
            data: result
        })
    }catch(err:any){
        res.status(500).json({
          success: false,
          message: err.message,
          error: err,
        });
    }
}


export const updateMarquee = async(req:Request, res:Response)=>{
    const {id} = req.params





    if(!id){
        return res.status(404).json({
            success: false,
            message: "Id is require"
        })
    }

    try{
        const query = {_id: new ObjectId(id)}

      const {_id, ...payload} = req.body



        const result = await updateMarqueeService(query, payload);



        if(!result){
            return res.status(500).json({
                success: false,
                message: "No Data found in db"
            })
        }

        res.status(200).json({
            success: true,
            message: "Marquee updated successfully",
            data: result
        })

    }catch(err:any){
        res.status(500).json({
          success: false,
          message: err.message,
          error: err,
        });
    }
}


export const toggleMarqueeStatusController = async(req:Request, res:Response)=>{

  const {id} = req.params

  const query = {_id: new ObjectId(id)}

  if(!query){
    return res.status(404).json({
      success: false,
      message: "Id is require!!"
    })
  }

  const isActive = req.body;



  try{
    const result = await toggleMarqueeStatusService(query, isActive)

    if(!result){
      return res.status(500).json({
        success:false,
        message: "Marquee status toggle not updated yet!!"
      })
    }

    res.status(200).json({
      success: true,
      message: "Marquee status toggle successfully",
      data: result
    })


  }catch(err:any){
    res.status(500).json({
      success: false,
      message: err.message,
      error: err,
    });
  }
}

export const getAllMarquee = async(req:Request, res:Response)=>{
  try{
    const result= await getAllMarqueeService()

    if(!result.length){
      return res.status(404).json({
        success: false,
        message: "No data found in db",
      })
    }

    res.status(200).json({
      success: true,
      message: "Data found in db",
      data: result
    })
  }catch(err:any){
    res.status(500).json({
      success: false,
      message: err.message,
      error: err,
    });
  }
}

export const deleteMarqueeController = async(req:Request, res:Response)=>{
  const {id}= req.params

  try{
    const query = {_id: new ObjectId(id)}
    if(!query){
      return res.status(404).json({
        success: false,
        message: "Id is require"
      })
    }

    const result = await deleteMarquee(query)
    if(!result){
      return res.status(404).json({
        success: false,
        message: "No data found",
      })
    }

    res.status(300).json({
      success: true,
      message:"Marquee is deleted successfully",
      data: result
    })
  }catch(err:any){

  }
}
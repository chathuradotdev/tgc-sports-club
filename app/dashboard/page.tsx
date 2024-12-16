"use client"

import { useEffect, useState } from "react"
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/app/components/ui/dialog"
import { ArrowRight, Printer, LogOut } from 'lucide-react'
import { toast } from "@/app/components/ui/use-toast"
import { useUser } from '@clerk/nextjs';

interface PoolTable {
  id: number
  occupied: boolean
  occupant: string
  startTime: Date | null
  endTime: Date | null
  bill: number | null
}

interface BillBreakdown {
  initialCharge: number
  additionalCharge: number
  totalBill: number
  totalMinutes: number
  additionalMinutes: number
}

export default function PoolClubManager() {
    const { user, isLoaded, isSignedIn } = useUser();
  const [poolTables, setPoolTables] = useState<PoolTable[]>([
    { id: 1, occupied: false, occupant: "", startTime: null, endTime: null, bill: null },
    { id: 2, occupied: false, occupant: "", startTime: null, endTime: null, bill: null },
    { id: 3, occupied: false, occupant: "", startTime: null, endTime: null, bill: null },
  ])

  const [endGameConfirmOpen, setEndGameConfirmOpen] = useState(false)
  const [endGameReceiptOpen, setEndGameReceiptOpen] = useState(false)
  const [startGameDialogOpen, setStartGameDialogOpen] = useState(false)
  const [currentTable, setCurrentTable] = useState<PoolTable | null>(null)
  const [tableToStart, setTableToStart] = useState<PoolTable | null>(null)
  const [loggedInUser, setLoggedInUser] = useState("John Doe")
  const [billBreakdown, setBillBreakdown] = useState<BillBreakdown | null>(null)

   // Check if the user is loaded and signed in
   useEffect(() => {
    if (isLoaded && isSignedIn) {
      // You can set the logged-in user details here
      console.log("User Info:", user);
    } else if (isLoaded && !isSignedIn) {
      // Handle the case if the user is not signed in
      console.log("User is not signed in");
    }
  }, [isLoaded, isSignedIn, user]);

  const assignTable = (occupant: string) => {
    if (tableToStart) {
      if (occupant.trim() === "") {
        toast({
          title: "Error",
          description: "Please enter a player name.",
          variant: "destructive",
        })
        return
      }
      setPoolTables(
        poolTables.map((table) =>
          table.id === tableToStart.id
            ? { ...table, occupied: true, occupant, startTime: new Date(), endTime: null, bill: null }
            : table
        )
      )
      setStartGameDialogOpen(false)
      setTableToStart(null)
      toast({
        title: "Game Started",
        description: `Table ${tableToStart.id} assigned to ${occupant}`,
        variant:"success",
      })
    }
  }

  const showStartGameDialog = (tableId: number) => {
    const table = poolTables.find(t => t.id === tableId)
    if (table) {
      if (table.occupant.trim() === "") {
        toast({
          title: "Error",
          description: "Please enter a player name before starting the game.",
          variant: "destructive",
        })
        return
      }
      setTableToStart(table)
      setStartGameDialogOpen(true)
    }
  }

  const showEndGameConfirm = (tableId: number) => {
    const table = poolTables.find(t => t.id === tableId)
    if (table) {
      setCurrentTable({ ...table, endTime: new Date() })
      setEndGameConfirmOpen(true)
    }
  }

  const confirmEndGame = () => {
    if (currentTable) {
      const breakdown = calculateBill(currentTable)
      setBillBreakdown(breakdown)
      setEndGameConfirmOpen(false)
      setEndGameReceiptOpen(true)
    }
  }

  const finalizeEndGame = () => {
    if (currentTable && billBreakdown) {
      setPoolTables(
        poolTables.map((table) =>
          table.id === currentTable.id
            ? { ...currentTable, occupied: false, bill: billBreakdown.totalBill }
            : table
        )
      )
      setEndGameReceiptOpen(false)
      setCurrentTable(null)
      setBillBreakdown(null)
      toast({
        title: "Game Ended",
        description: `Table ${currentTable.id} is now available`,
        variant:"destructive",
      })
    }
  }

  const calculateBill = (table: PoolTable): BillBreakdown => {
    if (table.startTime && table.endTime) {
      const durationInMinutes = Math.ceil((table.endTime.getTime() - table.startTime.getTime()) / (1000 * 60))
      let totalBill = 0
      let additionalMinutes = 0
      let additionalCharge = 0

      if (durationInMinutes <= 60) {
        totalBill = 1000
      } else {
        totalBill = 1000
        additionalMinutes = durationInMinutes - 60
        if (additionalMinutes > 10) {
          const chargeableMinutes = Math.ceil(additionalMinutes / 15) * 15
          additionalCharge = (chargeableMinutes / 60) * 1000
          totalBill += additionalCharge
        }
      }

      return {
        initialCharge: 1000,
        additionalCharge,
        totalBill,
        totalMinutes: durationInMinutes,
        additionalMinutes
      }
    }
    return {
      initialCharge: 0,
      additionalCharge: 0,
      totalBill: 0,
      totalMinutes: 0,
      additionalMinutes: 0
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleLogout = () => {
    console.log("User logged out")
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      variant:"success",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 p-4">
      <div className="container mx-auto">
        <div className="mb-8 flex items-center justify-between rounded-lg bg-white bg-opacity-80 p-4 shadow-lg backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-gray-900">TGC Pool Club Table Management</h1>
          {/* <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-gray-700">{loggedInUser}</span>
            <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div> */}
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {poolTables.map((table) => (
            <div key={table.id} className="relative">
              <Card className="transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 opacity-75 blur"></div>
                <div className="relative bg-white">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 pb-10 pt-6">
                    <CardTitle className="text-center text-2xl font-bold text-white">
                      Table {table.id}
                    </CardTitle>
                  </CardHeader>
                  <div className="absolute left-0 right-0 top-[5.5rem] h-4 bg-gradient-to-r from-blue-600 to-purple-700"></div>
                  <CardContent className="relative -mt-4 rounded-t-2xl bg-white px-6 pt-6">
                    <div className="absolute -left-0.5 -right-0.5 -top-4 h-4 rounded-t-2xl bg-gradient-to-r from-blue-500 to-purple-600"></div>
                    <div className="space-y-4">
                      {table.occupied ? (
                        <div className="rounded-lg bg-gray-50 p-4 shadow-inner">
                          <p className="font-medium text-gray-700">Occupied by: {table.occupant}</p>
                          <p className="text-sm text-gray-600">
                            Start Time: {table.startTime && formatTime(table.startTime)}
                          </p>
                        </div>
                      ) : (
                        <Input
                          placeholder="Enter player name"
                          value={table.occupant}
                          onChange={(e) => {
                            setPoolTables(poolTables.map(t => 
                              t.id === table.id ? { ...t, occupant: e.target.value } : t
                            ))
                          }}
                          className="w-full"
                        />
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-white px-6 pb-6">
                    <div className="flex w-full flex-col gap-3">
                      {!table.occupied ? (
                        <Button
                          onClick={() => showStartGameDialog(table.id)}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        >
                          Start Game
                        </Button>
                      ) : (
                        <Button
                          onClick={() => showEndGameConfirm(table.id)}
                          variant="destructive"
                          className="w-full"
                        >
                          End Game
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </div>
              </Card>
              {table.occupied ? (
                <div className="absolute right-2 top-2 z-10">
                  <span className="rounded-full bg-red-500 px-3 py-1 text-sm font-medium text-white shadow-lg">
                    Game Started
                  </span>
                </div>
              ) : (
                <div className="absolute right-2 top-2 z-10">
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-sm font-medium text-white shadow-lg">
                    Available
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={startGameDialogOpen} onOpenChange={setStartGameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Start Game</DialogTitle>
          </DialogHeader>
          {tableToStart && (
            <div className="space-y-4 p-4">
              <p>Are you sure you want to start a game for Table {tableToStart.id}?</p>
              <p>Player: {tableToStart.occupant}</p>
            </div>
          )}
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => setStartGameDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => assignTable(tableToStart?.occupant || "")} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={endGameConfirmOpen} onOpenChange={setEndGameConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>End Game Confirmation</DialogTitle>
          </DialogHeader>
          {currentTable && (
            <div className="space-y-4 p-4">
              <p>Are you sure you want to end the game for Table {currentTable.id}?</p>
              <p>Player: {currentTable.occupant}</p>
            </div>
          )}
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="primary" onClick={() => setEndGameConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmEndGame} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={endGameReceiptOpen} onOpenChange={setEndGameReceiptOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Game Receipt</DialogTitle>
          </DialogHeader>
          {currentTable && billBreakdown && (
            <div className="space-y-4 p-4">
              <div className="rounded-lg bg-gray-50 p-4 shadow-inner">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Game Details</h2>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-600">Player:</span>
                    <span className="font-medium text-gray-900">{currentTable.occupant}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Start Time:</span>
                    <span className="font-medium text-gray-900">
                      {currentTable.startTime && formatTime(currentTable.startTime)}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">End Time:</span>
                    <span className="font-medium text-gray-900">
                      {currentTable.endTime && formatTime(currentTable.endTime)}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Total Time:</span>
                    <span className="font-medium text-gray-900">{billBreakdown.totalMinutes} minutes</span>
                  </p>
                  <div className="mt-4 border-t pt-4">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Initial Charge (60 min):</span>
                      <span className="font-medium text-gray-900">Rs : {billBreakdown.initialCharge}</span>
                    </p>
                    {billBreakdown.additionalMinutes > 0 && (
                      <p className="flex justify-between">
                        <span className="text-gray-600">Additional Time:</span>
                        <span className="font-medium text-gray-900">{billBreakdown.additionalMinutes} minutes</span>
                      </p>
                    )}
                    {billBreakdown.additionalCharge > 0 && (
                      <p className="flex justify-between">
                        <span className="text-gray-600">Additional Charge:</span>
                        <span className="font-medium text-gray-900">Rs: {billBreakdown.additionalCharge}</span>
                      </p>
                    )}
                    <p className="flex justify-between text-lg font-bold mt-2">
                      <span>Total Bill:</span>
                      <span className="text-blue-600">Rs: {billBreakdown.totalBill}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
    
    <DialogFooter className="sm:justify-start">
  <Button
    type="button"
    onClick={handlePrint}
    className="bg-green-500 hover:bg-green-600"
  >
    Print Receipt
  </Button>
  <Button
    type="button"
    onClick={finalizeEndGame}
    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
  >
    Close Game
  </Button>
  <Button type="button" className="bg-red-500 hover:bg-red-600" variant="primary" onClick={() => setEndGameReceiptOpen(false)}>
              Cancel
            </Button>
</DialogFooter>


        </DialogContent>
      </Dialog>
    </div>
  )
}


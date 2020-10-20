using System;
using System.Collections.Generic;
using System.Drawing;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json;

namespace Drawing
{
    /************************************************************************
     *                                                                      *
     *          User, DrawObject, Point and Room Classes                    *
     *                                                                      *
     ************************************************************************/
    public class User
    {
        public string Id { get; set; }
        public string Color { get; set; }
        public string Name { get; set; }

        public User(string id, string color, string name) => (Id, Color, Name) = (id, color, name);
    }
    public class DrawObject
    {
        public string Id { get; set; }
        public string Object { get; set; }
    }
    public class Point
    {
        public double X { get; set; }
        public double Y { get; set; }
    }
    public class Room
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Name { get; set; } = "Untitled";
        private List<User> users { get; set; }
        private List<DrawObject> drawObjects { get; set; }
        private List<Point> points { get; set; }
        public bool IsEmpty => users.Count == 0;
        public int NoUser => users.Count;

        public User GetUser(string id) => users.Find(r => r.Id == id);
        public List<User> getUserList() => users;
        public void AddUser(User user) => users.Add(user);
        public void RemoveUser(string id) => users.Remove(users.Find(r => r.Id == id));
        public List<Point> getPoints() => points;
        public void AddPoint(Point p) => points.Add(p);
        public void RemovePoint(Point p) => points.Remove(points.Find(point => point.X == p.X && point.Y == p.Y));
        public DrawObject GetDraw(string id) => drawObjects.Find(r => r.Id == id);
        public List<DrawObject> getDrawList() => drawObjects;
        public void AddDraw(DrawObject o) => drawObjects.Add(o);
        public void RemoveDraw(string id) => drawObjects.Remove(drawObjects.Find(r => r.Id == id));

        public Room()
        {
            users = new List<User>();
            drawObjects = new List<DrawObject>();
            points = new List<Point>();
        }
    }

    // Hub
    public class DrawHub : Hub
    {
        // list of room
        private static List<Room> rooms = new List<Room>();

        // Create Room function
        public string CreateRoom()
        {
            var room = new Room();
            rooms.Add(room);
            return room.Id;
        }
        public async Task AssignName(string name)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            room.Name = name;
            await Clients.OthersInGroup(roomId).SendAsync("UpdateName", name);
            await UpdateList();
        }

        /************************************************************************
        *                                                                      *
        *                 Real time function for drawing                       *
        *                                                                      *
        ************************************************************************/
        public async Task StartDraw(string id, Point point, string color, string size, string fill)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            await Clients.OthersInGroup(roomId).SendAsync("StartDraw", id, point, color, size, fill);
        }
        public async Task Draw(string id, Point pointA, Point pointB)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            await Clients.OthersInGroup(roomId).SendAsync("Draw", id, pointA, pointB);
        }

        public async Task StartRect(string id, Point point, string color, string size, string fill)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            await Clients.OthersInGroup(roomId).SendAsync("StartRect", id, point, color, size, fill);
        }
        public async Task DrawRect(string id, Point point, Point box)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            await Clients.OthersInGroup(roomId).SendAsync("DrawRect", id, point, box);
        }
        public async Task StartCircle(string id, Point point, string color, string size, string fill)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            await Clients.OthersInGroup(roomId).SendAsync("StartCircle", id, point, color, size, fill);
        }
        public async Task DrawCircle(string id, Point point, Point box)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            await Clients.OthersInGroup(roomId).SendAsync("DrawCircle", id, point, box);
        }

        public async Task DrawLine(string id, Point point1, Point point2, string color, string size)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            await Clients.OthersInGroup(roomId).SendAsync("DrawLine", id, point1, point2, color, size);
        }
        public async Task PushPoint(Point point)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            room.AddPoint(point);
            await Clients.OthersInGroup(roomId).SendAsync("PushPoint", point);
        }
        public async Task PopPoint(Point point)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            room.RemovePoint(point);
            await Clients.OthersInGroup(roomId).SendAsync("PopPoint", point);
        }

        public async Task RemoveObject(string id)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            room.RemoveDraw(id);
            await Clients.OthersInGroup(roomId).SendAsync("RemoveObject", id);
        }
        public async Task Reset()
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            room.getDrawList().Clear();
            room.getPoints().Clear();
            await Clients.OthersInGroup(roomId).SendAsync("Reset");
        }
        public async Task Create(string obj)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            await Clients.OthersInGroup(roomId).SendAsync("Create", obj);
        }
        public async Task MoveObject(string id, Object obj)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            await Clients.OthersInGroup(roomId).SendAsync("MoveObject", id, obj);
        }

        // Insert image
        public async Task InsertImage(string id, string url, Point point1, Point point2)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            await Clients.OthersInGroup(roomId).SendAsync("InsertImage", id, url, point1, point2);
        }
        //Update cursor position
        public async Task UpdateCursor(Point cursorPos)
        {
            string id = Context.ConnectionId;
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }
            User user = room.GetUser(id);

            await Clients.OthersInGroup(roomId).SendAsync("UpdateCursor", id, cursorPos, user.Color);
        }

        // Insert object into object list
        public void InsertObjectIntoList(DrawObject o)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];

            Room room = rooms.Find(r => r.Id == roomId);
            room.AddDraw(o);
        }
        // Update object list
        public void UpdateObjectInList(DrawObject o)
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];

            Room room = rooms.Find(r => r.Id == roomId);
            if (room.GetDraw(o.Id) != null)
            {
                room.RemoveDraw(o.Id);
                room.AddDraw(o);
            }
        }

        /************************************************************************
         *                                                                      *
         *                       Update list and room function                  *
         *                                                                      *
         ************************************************************************/
        // Update User list in room
        public async Task UpdateUserList()
        {
            string roomId = Context.GetHttpContext().Request.Query["roomId"];
            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
            }

            await Clients.Group(roomId).SendAsync("UpdateUserList", JsonConvert.SerializeObject(room.getUserList()));
        }

        // Update Room List
        private async Task UpdateList(string id = null)
        {
            var list = rooms;
            var emptyRoom = rooms.Find(r => r.IsEmpty == true);
            if (emptyRoom != null)
                rooms.Remove(emptyRoom);

            if (id == null) await Clients.All.SendAsync("UpdateList", list);
            else await Clients.Client(id).SendAsync("UpdateList", list);
        }

        /************************************************************************
         *                                                                      *
         *                 List and room connection function                    *
         *                                                                      *
         ************************************************************************/

        private async Task ListConnected()
        {
            string id = Context.ConnectionId;
            await UpdateList(id);
        }

        private async Task RoomConnected()
        {
            Random rnd = new Random();

            string id = Context.ConnectionId;
            string name = Context.GetHttpContext().Request.Query["name"];
            string roomId = Context.GetHttpContext().Request.Query["roomId"];

            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
                return;
            }

            await Clients.Caller.SendAsync("Restore", room.Name,JsonConvert.SerializeObject(room.getDrawList()), JsonConvert.SerializeObject(room.getPoints()));

            string randomColor = String.Format("#{0:X6}", rnd.Next(0x1000000));
            room.AddUser(new User(id, randomColor, name));
            await Groups.AddToGroupAsync(id, roomId);
            await Clients.Group(roomId).SendAsync("UserJoin", JsonConvert.SerializeObject(room.GetUser(id)));
            await UpdateUserList();
            await UpdateList();
        }

        private async Task RoomDisconnected()
        {
            string id = Context.ConnectionId;
            string roomId = Context.GetHttpContext().Request.Query["roomId"];

            Room room = rooms.Find(r => r.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("Reject");
                return;
            }
            string username = Context.GetHttpContext().Request.Query["name"];
            await Clients.OthersInGroup(roomId).SendAsync("UserLeft", JsonConvert.SerializeObject(room.GetUser(id)));

            room.RemoveUser(id);
            await UpdateUserList();
            if (room.IsEmpty)
            {
                rooms.Remove(room);
            }
            await UpdateList();
        }

        /************************************************************************
         *                                                                      *
         *          Override on user connected & disconnected function          *
         *                                                                      *
         ************************************************************************/
        public override async Task OnConnectedAsync()
        {
            string page = Context.GetHttpContext().Request.Query["page"];

            switch (page)
            {
                case "list": await ListConnected(); break;
                case "draw": await RoomConnected(); break;
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            string page = Context.GetHttpContext().Request.Query["page"];

            switch (page)
            {
                case "draw": await RoomDisconnected(); break;
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
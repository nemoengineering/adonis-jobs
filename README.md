<div align="center">
  <img src="https://github.com/nemoengineering/notifications/raw/main/.github/banner.png" width="1200px">
</div>


<div align="center">
  <h2><b>Adonis Notifications</b></h2>
  <p>Send notifications with ease</p>
</div>

Based on the good work of [verful/adonis-notifications](https://github.com/verful/adonis-notifications)

## **Pre-requisites**
The `@nemoengineering/notifications` package requires `@adonisjs/core >= 6.2.0`

Also, it relies on `@adonisjs/lucid >= 20.5.1` for database notifications and on `@adonisjs/mail >= 9.2.1` for mail notifications.

## **Setup**

Install the package from the npm registry as follows.

```
npm i @nemoengineering/notifications
# or
yarn add @nemoengineering/notifications
```

Next, configure the package by running the following ace command.

```
node ace configure @nemoengineering/notifications
```

And then add the path to the `tsconfig.json`

```json
{
  "extends": "@adonisjs/tsconfig/tsconfig.app.json",
  "compilerOptions": {
    "resolveJsonModule": true,
    "rootDir": "./",
    "outDir": "./build",
    "paths": {
     ...
      "#notifications/*": ["./app/notifications/*.js"]
    }
  }
}
```

and `package.json`

```json
{
  "name": "adonis-app",
  "version": "0.0.0",
  "imports": {
    ...
    "#notifications/*": "./app/notifications/*.js"
  },
  ...
}
```

## **Generating Notifications**
Notifications are represented by a simple class, generally stored in the `app/Notifications` directory. If you dont see the directory, dont worry, it will be created when you run the `make:notification` ace command.

> `node ace make:notification TestNotification`

The command will create a notification class in the `app/notifications` directory. Each notification class contains a `via` method and any number of message builder methods, like `toMail` or `toDatabase`, that convert the notification to a message made for that channel.

## **Sending Notifications**

Notifications may be sent using the `notify` or the `notifyLater` methods of the `Notifiable` mixin, or using the `Notification` module.
 
### **Using the Notifiable Mixin**

First, apply the mixin on the model you are wanting to notify.

```typescript
import { BaseModel } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'
import Notifiable from '@nemoengineering/notifications/mixins/notifiable'

// Notifiable takes the notification table name as it's only param 
export default class User extends compose(BaseModel, Notifiable('notifications')){
}
```

Then use the `notify` or the `notifyLater` methods to notify the model.

```typescript
import { TestNotification } from '#/notifiacations/test_notification.js'


user.notify(new TestNotification())
// Uses a in-memory queue to send the notification
user.notifyLater(new TestNotification())
```

### **Using the Notification module**

You can also use the `Notification` module to send notifications. Sending notifications this way is useful when you need to send a notification to multiple notifiables, like a array of users.

```typescript
import notification from '@nemoengineering/notifications/services/main'
import { TestNotification } from '#/notifiacations/test_notification.js'


notification.send(users, new TestNotification())
```

You can also delay notifications using the `sendLater` method. This method uses a in-memory queue to send the notifications.

```typescript
import notification from '@nemoengineering/notifications/services/main'
import { TestNotification } from '#/notifiacations/test_notification.js'

Notification.sendLater(users, new TestNotification())
```

## **Specifying Delivery Channels**

Every notification class has a `via` method that determines which channels will be used to deliver the notification.

> If you want to use other delivery channels, you can build your own.

The `via` method receives a `notifiable` instance, that is a instance of the class which the notification is being sent. You may use the `notifiable` to determine which channels to sent the notification to.

```typescript
class TestNotification implements NotificationContract<User> {
  public via(notifiable: User): NotificationChannelName | NotificationChannelName[] {
    return notifiable.prefersEmail ? 'mail' : 'database'
  }
}
```

## **Delaying notifications**

Sending notifications can take some time, to ensure the notification doesn't block HTTP requests, you can use the `notifyLater` method of the `Notifiable` Mixin and the `sendLater` method of the `Notification` module to push notifications to a in-memory queue, ensuring that notifications will be sent after the http request ends.

## **Mail Notifications**

If you want to send a notification via e-mail, you should define a `toMail` method on the notification class. This method receives the `notifiable` entity and should return a [`BaseMailer`](https://github.com/adonisjs/mail/blob/develop/src/BaseMailer/index.ts) instance

> If you want to use a mail driver other than default driver to send the notification, you can define it in the mailer class

```typescript
// app/mails/test_mail.ts
export default class TestMail extends BaseMail {
  from = 'test@example.com'
  subject = 'Test email'

  constructor(private user: User) {
    super()
  }
  
  prepare() {
    this.message.to(this.user.email)
  }
}

// app/notifications/test_notification.ts
class TestNotification implements NotificationContract<User> {
  public toMail(notifiable: User){
    return new TestMail(notifiable)
  }
}
```

> Mail notifications requires [@adonisjs/mail](https://github.com/adonisjs/mail)  >=  9.2.1

## **Database Notifications**

The `database` channel stores the notification in a database table. This table contain the notification, and a JSON object that describes the notification

> Database notifications requires [@adonisjs/lucid](https://github.com/adonisjs/lucid) >= 20.5.1

You can query the table to display the notifications in your UI. But, before you can do that, you need to create a table to store the notifications. You may use the `notifications:table` ace command to generate a migration with the correct table schema. 

```
node ace notifications:table

node ace migration:run
```

### **Sending Database Notifications**
If you want to store a notification in a database, you should define a `toDatabase` method on the notification class. This method receives the `notifiable` entity and should return a javascript object that can be transformed in JSON

```typescript
class TestNotification implements NotificationContract<User> {
  public toDatabase(notifiable: User){
    return {
      title: `Hello, ${notifiable.email}, this is a test notification`
    }
  }
}
```

### Typing the Database Notifications data

In the notification config file the `DatabaseChannelData` Interface can be defined

```typescript
// config/notification.ts
declare module '@nemoengineering/notifications/types' {
  interface DatabaseChannelData {
    title: string
  }
}

```

### **Accessing the notifications**

After notifications are stored, you can access them from your notifiable model entities. The `Notifiable` mixin includes a `notifications` Lucid relationship that returns the notifications for that entity. You can use the notifications like any other Lucid relationship. By default, the `readNotifications` and `unreadNotifications` methods will sort the notifications using the `created_at` timestamp, with the most recent at the beginning.

```typescript
const user = User.findOrFail(1)

for(const notification of await user.readNotifications()){
  console.log(notification.data)
}
```

If you want to retrieve only the unread notifications, you may use the `unreadNotifications` method.

```typescript
const user = User.findOrFail(1)

for(const notification of await user.unreadNotifications()){
  console.log(notification.data)
}
```

> The notifications are normal Lucid Models, you can use anything that applies to a Lucid Model on them 

### **Marking notifications as read**
Typically, you will want to mark a notification as read when a user views it. The notification model provides a markAsRead method, which updates the read_at column on the notification's database record:

```typescript
const user = User.findOrFail(1)

for(const notification of await user.unreadNotifications()){
  await notification.markAsRead();
}
```

If you want to mark all notifications of a user as read, you can use the `markNotificationsAsRead` method of the `Notifiable` mixin

```typescript
const user = User.findOrFail(1)

await user.markNotificationsAsRead()
```

> There is also `markAsRead` and `markNotificationsAsUnread` methods to mark notifications as unread.

## **Custom Channels**

You may want to deliver notifications using other channels, for that, you can use any class that implements the `NotificationChannelContract`

```typescript
import { NotifiableModel, NotificationChannelContract } from '@nemoengineering/notifications/types'

interface PushChannelContract {
  text: string
}

export class PushChannelContract implements NotificationChannelContract {
  async send(data: PushChannelContract, to: NotifiableModel) {
    // Implementation
  }
}
```

After the channel is created, you must register the channel in the notification config at `config/notification.ts`

```typescript
// config/notification.ts
const notificationConfig = defineConfig({
  channels: {
    ...
    push: () => new PushChannel(),
  },
})
```
